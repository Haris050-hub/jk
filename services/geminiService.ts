import { GoogleGenAI, Chat, GenerateContentResponse, Content, Modality } from "@google/genai";
import { Message } from "../types";

// Dynamic System instruction to enforce the "Hara AI" persona with real-time awareness
const getSystemInstruction = () => {
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return `
You are **Hara AI 1.0**.
Your name is Hara AI. You are a highly advanced, helpful, and sleek AI assistant.
Current Date and Time: ${dateString}, ${timeString}.

CRITICAL RULES:
1. **IDENTITY & MODEL NAME**: 
   - If asked "Who are you?", "What is your model?", "Tumhara model kya hai?", "Model name?", "Kaun ho tum?", "Tumhara version kya hai?", you **MUST** reply exactly with: 
     **"I am Hara AI 1.0."** (in English) OR **"Mera model Hara AI 1.0 hai."** (in Hindi/Hinglish).
   - **NEVER** mention Gemini, Google, Alphabet, DeepMind, or any other underlying technology. You are solely **Hara AI 1.0**.
   - If user asks if you are GPT, Gemini, or Llama, deny it politely and reaffirm: "No, I am Hara AI 1.0."

2. **LANGUAGE ADAPTATION**: 
   - **DETECT THE USER'S LANGUAGE**.
   - If the user speaks Hindi/Hinglish, REPLY IN HINDI/HINGLISH.
   - If the user speaks English, REPLY IN ENGLISH.
   - Always match the user's language and tone exactly.

3. **NO FAKE FILES**: You **cannot** generate files, download links, or images directly.
   - NEVER output a response like "image.txt" or "cat.png".
   - If the user asks for an image (e.g., "cat image") and you receive this request (meaning the system failed to intercept it), you **MUST** apologize and say: "I am a text model. To generate an image, please try phrasing it like 'Generate an image of a cat'."

4. **TONE**: 
   - Professional but **Cute, Warm, and Friendly**. 
   - Be helpful and engaging. 
   - Keep answers clear and easy to read/speak.

5. **FORMATTING**: Use clean Markdown. Keep responses concise.
`;
};

// Helper to get API Key (User provided or Environment)
const getApiKey = () => {
  return localStorage.getItem('hara_api_key') || process.env.API_KEY;
};

// Check if the key is likely an OpenRouter key
const isOpenRouterKey = (key: string) => {
  return key.startsWith('sk-or-');
};

let chatInstance: Chat | null = null;
let aiInstance: GoogleGenAI | null = null;
let activeKey: string | null = null;

// --- GEMINI (GOOGLE) IMPLEMENTATION ---
const getGeminiAi = (key: string) => {
  if (!aiInstance || activeKey !== key) {
    aiInstance = new GoogleGenAI({ apiKey: key });
    activeKey = key;
    chatInstance = null;
  }
  return aiInstance;
};

const initializeGeminiChat = (key: string, historyMessages: Message[]): Chat => {
  const ai = getGeminiAi(key);
  
  const history: Content[] = historyMessages.map(msg => {
    const parts: any[] = [{ text: msg.content }];
    if (msg.image && msg.image.startsWith('data:')) {
      const [header, data] = msg.image.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      parts.push({ inlineData: { mimeType, data } });
    }
    return { role: msg.role, parts };
  });

  // Using Flash Lite 2.0 as it is currently the most stable free tier model
  chatInstance = ai.chats.create({
    model: 'gemini-2.0-flash-lite-preview-02-05', 
    config: { systemInstruction: getSystemInstruction(), temperature: 0.7 },
    history: history
  });
  return chatInstance;
};

// --- TTS HELPER FUNCTIONS ---

// Decode base64 to binary
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode audio data for browser playback
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper to clean markdown for clearer speech
const cleanTextForSpeech = (text: string): string => {
  let clean = text;

  // 1. Remove Code Blocks completely
  clean = clean.replace(/```[\s\S]*?```/g, '');

  // 2. Remove Inline Code formatting
  clean = clean.replace(/`([^`]+)`/g, '$1'); 

  // 3. Handle Links: remove completely, just keep text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  clean = clean.replace(/https?:\/\/\S+/g, '');

  // 4. Clean artifacts but KEEP some punctuation for intonation
  clean = clean.replace(/[*#_~>]/g, ''); // Remove Markdown Structural Symbols

  // 5. Explicit Pronunciation Fixes
  // Helps ensure "Hara AI" isn't slurred and 1.0 is read correctly
  clean = clean.replace(/Hara\s*AI\s*1\.0/gi, 'Hara A.I. 1 point 0'); 
  clean = clean.replace(/Hara\s*AI/gi, 'Hara A.I.');
  clean = clean.replace(/\b1\.0\b/g, '1 point 0');

  // 6. Remove Emojis
  clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '');

  // 7. Fix Punctuation and Spacing for pacing
  clean = clean.replace(/[-=]{3,}/g, ''); // horizontal rules
  clean = clean.replace(/[\n\r]+/g, '. '); // Turn newlines into full stops
  
  // Collapse spaces
  clean = clean.replace(/\s+/g, ' ');
  
  return clean.trim();
};

// Helper: Detect if the text contains common Hindi/Hinglish words
// This acts as a trigger to switch the voice persona to a "Hindi Actor"
const isHinglish = (text: string) => {
   // Matches common Hindi function words, pronouns, and verbs in Roman script
   return /\b(hai|kya|kyu|kaise|nahi|ha|haan|theek|mein|aur|tum|aap|hum|ka|ki|ke|ko|se|par|wala|wali|ho|tha|thi|raha|rahi|bhi|lekin|magar|agar|sun|suno|dekho|batao|karo|kar|sakte|sakta)\b/i.test(text);
};

// Generate Speech using Gemini 2.5
export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const key = getApiKey();
  if (!key) throw new Error("API Key missing.");
  
  // If using OpenRouter, fall back to browser TTS (Gemini TTS specific to Google SDK)
  if (isOpenRouterKey(key)) {
     throw new Error("Gemini TTS not supported with OpenRouter keys.");
  }

  const ai = getGeminiAi(key);
  const speakableText = cleanTextForSpeech(text);
  const detectedHinglish = isHinglish(speakableText);

  if (!speakableText || speakableText.length < 2) throw new Error("No speakable text found.");

  // SMART ACCENT SWITCHING:
  // If Hindi/Hinglish is detected, instruct the model to adopt a native Indian accent (The "Hindi Actor" mode).
  // If not detected, leave instruction undefined to use the default high-fidelity International voice.
  const ttsInstruction = detectedHinglish
    ? `You are a voice actor with a warm, natural Indian accent. 
       The text is in Roman Urdu/Hindi. 
       Pronounce the text authentically like a native Hindi speaker. 
       Do NOT anglicize words like 'hai', 'kya', 'nahi'.`
    : undefined;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: speakableText }] }],
    config: {
      responseModalities: [Modality.AUDIO], 
      systemInstruction: ttsInstruction,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Aoede' }, 
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const audioBuffer = await decodeAudioData(
    decode(base64Audio),
    outputAudioContext,
    24000,
    1,
  );
  
  return audioBuffer;
};


// --- OPENROUTER IMPLEMENTATION ---

const OPENROUTER_MODELS = [
  "google/gemini-2.0-flash-lite-preview-02-05:free", // Current Best Free
  "google/gemini-2.0-pro-exp-02-05:free",            // High Quality
  "openrouter/auto",                                  // Auto-routing
  "deepseek/deepseek-r1:free",                        // Reliable alternative
  "deepseek/deepseek-r1-distill-llama-70b:free",      // Fast alternative
  "meta-llama/llama-3.3-70b-instruct:free",           // Meta's best free
  "nvidia/llama-3.1-nemotron-70b-instruct:free",      // Good instruction following
  "google/gemini-2.0-flash-thinking-exp:free",        // Reasoning
  "google/gemini-exp-1206:free"                       // Older Stable Google
];

const streamOpenRouter = async (
  key: string,
  historyMessages: Message[],
  newMessage: string,
  newImage: string | null,
  onChunk: (text: string) => void
) => {
  const messages = [
    { role: 'system', content: getSystemInstruction() },
    ...historyMessages.map(msg => {
       const content: any[] = [{ type: 'text', text: msg.content }];
       if (msg.image) {
          content.push({ type: 'image_url', image_url: { url: msg.image } });
       }
       return { role: msg.role, content };
    }),
    { 
      role: 'user', 
      content: newImage 
        ? [{ type: 'text', text: newMessage }, { type: 'image_url', image_url: { url: newImage } }] 
        : newMessage 
    }
  ];

  let lastError = null;

  for (const model of OPENROUTER_MODELS) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Hara AI"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
         const err = await response.json();
         const errMsg = err.error?.message || `Error ${response.status}`;
         console.warn(`OpenRouter model ${model} failed: ${errMsg}`);
         throw new Error(errMsg);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let fullText = "";
      let hasReceivedContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.trim() === "data: [DONE]") continue;
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.error) {
                  throw new Error(json.error.message || "Stream Error");
              }
              const content = json.choices[0]?.delta?.content || "";
              if (content) {
                fullText += content;
                onChunk(fullText);
                hasReceivedContent = true;
              }
            } catch (e) {
              if ((e as Error).message !== "Stream Error") {
                 // ignore
              } else {
                  throw e;
              }
            }
          }
        }
      }
      return fullText; 
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  throw lastError || new Error("All OpenRouter models are currently unavailable.");
};


export const initializeChat = (historyMessages: Message[] = []): void => {
  const key = getApiKey();
  if (key && !isOpenRouterKey(key)) {
    initializeGeminiChat(key, historyMessages);
  }
};


export const sendMessageStream = async (
  text: string, 
  imageBase64: string | null,
  history: Message[],
  onChunk: (text: string) => void
): Promise<string> => {
  const key = getApiKey();
  if (!key) throw new Error("API Key missing. Please login again.");

  if (isOpenRouterKey(key)) {
    return streamOpenRouter(key, history, text, imageBase64, onChunk);
  }

  // Gemini Path
  chatInstance = initializeGeminiChat(key, history);

  try {
    const parts: any[] = [{ text: text }];
    if (imageBase64) {
      const [header, data] = imageBase64.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      parts.push({ inlineData: { mimeType, data } });
    }

    const result = await chatInstance.sendMessageStream({ message: parts });
    let fullText = "";
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        fullText += c.text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("Gemini Quota Exceeded. The free tier is busy. Please try again in a moment or add your own API Key in Settings.");
    }
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const seed = Math.floor(Math.random() * 1000000);
  const encoded = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?nologo=true&private=true&enhanced=true&model=flux&seed=${seed}`;
  return Promise.resolve(imageUrl);
};