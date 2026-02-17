import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { Copy, Check, Sparkles, X, Maximize2, Volume2, StopCircle, Loader2 } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface ChatMessageProps {
  message: Message;
  username?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, username }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Cleanup speech on unmount
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stopSpeaking = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
       audioContextRef.current.close();
       audioContextRef.current = null;
    }
    setIsSpeaking(false);
    setIsGeneratingAudio(false);
    // Fallback cancel for standard browser speech
    window.speechSynthesis.cancel();
  };

  const handleSpeak = async () => {
    if (isSpeaking || isGeneratingAudio) {
      stopSpeaking();
      return;
    }

    try {
      setIsGeneratingAudio(true);

      // Attempt High Quality Gemini TTS
      const audioBuffer = await generateSpeech(message.content);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
      };

      sourceRef.current = source;
      source.start(0);
      setIsSpeaking(true);

    } catch (error) {
      console.warn("Gemini TTS failed, falling back to browser TTS", error);
      
      // Fallback to Browser TTS
      const utterance = new SpeechSynthesisUtterance(message.content);
      // Try to find a Hindi voice if message might be hindi, otherwise default
      const voices = window.speechSynthesis.getVoices();
      // Simple heuristic: if text contains hindi chars, try to find hi-IN
      const hasHindi = /[\u0900-\u097F]/.test(message.content);
      if (hasHindi) {
          utterance.voice = voices.find(v => v.lang === 'hi-IN') || null;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Generate avatar URL
  const avatarUrl = isUser 
    ? `https://api.dicebear.com/9.x/adventurer/svg?seed=${username || 'User'}&backgroundColor=b6e3f4,c0aede,d1d4f9`
    : `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=HaraAI&backgroundColor=10b981`;

  return (
    <>
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 md:mb-6 group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
        <div className={`flex max-w-[88%] md:max-w-[80%] gap-2 md:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          
          {/* Avatar */}
          <div className={`
            flex-shrink-0 w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-sm mt-0.5 md:mt-1 overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800
          `}>
            {isUser ? (
              <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-hara-500 to-hara-600 flex items-center justify-center">
                  <Sparkles size={14} className="text-white md:w-4 md:h-4" />
              </div>
            )}
          </div>

          {/* Message Bubble */}
          <div className={`
            relative px-3.5 py-2.5 md:px-5 md:py-3.5 rounded-2xl text-[14px] md:text-base leading-relaxed shadow-sm transition-all
            ${isUser 
              ? 'bg-zinc-200/50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-sm border border-transparent dark:border-zinc-700/50' 
              : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-tl-sm border border-zinc-200 dark:border-zinc-800'}
          `}>
            
            {/* Image Attachment (User Uploaded or Generated) */}
            {message.image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700/50 shadow-sm bg-zinc-50 dark:bg-zinc-950 relative group/image">
                <img 
                  src={message.image} 
                  alt="Content" 
                  onClick={() => setIsZoomed(true)}
                  className="w-full h-auto object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                />
                <div 
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(true);
                  }}
                >
                  <Maximize2 size={14} />
                </div>
              </div>
            )}

            {/* Markdown Content */}
            <div className="prose dark:prose-invert prose-p:leading-6 md:prose-p:leading-7 prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800 prose-pre:rounded-lg max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    return !inline ? (
                      <div className="relative group/code my-3">
                        <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                          <div className="text-[10px] text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">Code</div>
                        </div>
                        <code className="block bg-zinc-50 dark:bg-zinc-950/50 p-2.5 md:p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs md:text-sm overflow-x-auto font-mono" {...props}>
                          {children}
                        </code>
                      </div>
                    ) : (
                      <code className="bg-zinc-100 dark:bg-zinc-800/80 px-1 py-0.5 rounded text-hara-700 dark:text-hara-300 font-mono text-xs md:text-sm" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Message Actions (Copy/Speak) - only for model */}
            {!isUser && !message.isStreaming && (
              <div className="absolute -bottom-5 md:-bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-3">
                <button 
                  onClick={handleCopy}
                  className="p-1 text-zinc-400 hover:text-hara-600 dark:hover:text-hara-400 transition-colors flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                
                <button 
                  onClick={handleSpeak}
                  disabled={isGeneratingAudio && !isSpeaking}
                  className={`p-1 transition-colors flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide
                    ${isSpeaking ? 'text-hara-600 dark:text-hara-400 animate-pulse' : 'text-zinc-400 hover:text-hara-600 dark:hover:text-hara-400'}
                  `}
                  title={isSpeaking ? "Stop speaking" : "Read aloud"}
                >
                  {isGeneratingAudio ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : isSpeaking ? (
                    <StopCircle size={12} />
                  ) : (
                    <Volume2 size={12} />
                  )}
                  {isGeneratingAudio ? 'Loading...' : isSpeaking ? 'Stop' : 'Speak'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {isZoomed && message.image && (
        <div 
          className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={message.image} 
              alt="Full size content" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button 
              onClick={() => setIsZoomed(false)}
              className="absolute -top-12 right-0 md:-right-12 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
