import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Zap, Menu, Image as ImageIcon, X, Sun, Moon, Mic, MicOff } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { Auth } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { AdminPanel } from './components/AdminPanel';
import { initializeChat, sendMessageStream, generateImage } from './services/geminiService';
import { Message, ChatSession, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const latestInputRef = useRef(input); // Track input for closures
  const ignoreEndRef = useRef(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('hara_theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
  }, []);

  // Update latest input ref
  useEffect(() => {
    latestInputRef.current = input;
  }, [input]);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('hara_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load User on Mount
  useEffect(() => {
    const savedUserString = localStorage.getItem('hara_current_user');
    const isAdminSession = localStorage.getItem('hara_is_admin') === 'true';
    if (savedUserString) {
      setUser({ username: savedUserString, isAdmin: isAdminSession });
    }
  }, []);

  // Load Sessions when User changes
  useEffect(() => {
    if (user) {
      const allSessions: Record<string, ChatSession[]> = JSON.parse(localStorage.getItem('hara_sessions') || '{}');
      const userSessions = allSessions[user.username] || [];
      setSessions(userSessions);

      if (userSessions.length > 0) {
        // Load most recent session
        const recent = userSessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setCurrentSessionId(recent.id);
        setMessages(recent.messages);
      } else {
        createNewSession(user.username, userSessions);
      }
    }
  }, [user]);

  // Persist sessions helper
  const persistSessions = (username: string, newSessions: ChatSession[]) => {
    const allSessions = JSON.parse(localStorage.getItem('hara_sessions') || '{}');
    allSessions[username] = newSessions;
    localStorage.setItem('hara_sessions', JSON.stringify(allSessions));
  };

  const saveSessions = (newSessions: ChatSession[]) => {
    if (!user) return;
    persistSessions(user.username, newSessions);
    setSessions(newSessions);
  };

  // Auto-scroll
  useEffect(() => {
    if (!showAdminPanel) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, showAdminPanel]);

  // Re-initialize chat when messages/history loads or changes significantly (switching sessions)
  useEffect(() => {
    if (messages.length > 0) {
      const validHistory = messages.filter(m => !m.isStreaming && m.role !== 'model' || (m.role === 'model' && m.content));
      initializeChat(validHistory);
    } else {
      initializeChat([]);
    }
  }, [currentSessionId]); 

  // Voice Input Handler
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until stopped manually
      recognition.interimResults = true;
      recognition.lang = 'en-US'; 
      
      ignoreEndRef.current = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
             alert("Microphone permission denied.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        // Append final results to input
        if (finalTranscript) {
             setInput(prev => {
                const spacer = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
                return prev + spacer + finalTranscript;
             });
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    } else {
      alert("Voice input is not supported in this browser. Please try Chrome, Edge or Safari.");
    }
  };

  const stopListening = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
      setIsListening(false);
  };

  const createNewSession = (username: string, currentSessions: ChatSession[] = sessions) => {
    const welcomeMsg: Message = {
      id: 'welcome-' + Date.now(),
      role: 'model',
      content: "Hello. I am **Hara AI 1.0**. How can I assist you today?",
      timestamp: Date.now()
    };
    
    const newSession: ChatSession = {
      id: Date.now().toString(),
      userId: username,
      title: 'New Conversation',
      messages: [welcomeMsg],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedSessions = [...currentSessions, newSession];
    persistSessions(username, updatedSessions);
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    setMessages([welcomeMsg]);
    setIsSidebarOpen(false); // close sidebar on mobile
    setShowAdminPanel(false); // ensure we show chat
  };

  const handleLogin = (newUser: User) => {
    localStorage.setItem('hara_current_user', newUser.username);
    if (newUser.isAdmin) {
      localStorage.setItem('hara_is_admin', 'true');
    } else {
      localStorage.removeItem('hara_is_admin');
    }
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('hara_current_user');
    localStorage.removeItem('hara_is_admin');
    setUser(null);
    setMessages([]);
    setCurrentSessionId(null);
    setShowAdminPanel(false);
  };

  const handleSelectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      setShowAdminPanel(false); // Go to chat view
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      const updatedSessions = sessions.filter(s => s.id !== id);
      saveSessions(updatedSessions);
      if (currentSessionId === id) {
        if (updatedSessions.length > 0) {
          handleSelectSession(updatedSessions[0].id);
        } else if (user) {
          createNewSession(user.username, updatedSessions);
        }
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSend = async (textOverride?: string) => {
    // Determine text to send: override -> input state -> nothing
    const userText = (typeof textOverride === 'string' ? textOverride : input).trim();
    const imageToSend = selectedImage;
    
    if ((!userText && !imageToSend) || isLoading) return;
    
    // Clear inputs immediately
    setInput('');
    setSelectedImage(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      image: imageToSend || undefined,
      timestamp: Date.now()
    };

    const placeholderId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: placeholderId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    const updatedMessages = [...messages, newMessage, placeholderMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const isImageGeneration = /(draw|generate|create|make|banao|dikhao|imagine|visualize).*(image|photo|picture|pic|art|tasveer|sketch|wallpaper)|(image|photo|picture|pic|tasveer|sketch|wallpaper)\s+(of|ka|ki|ke)/i.test(userText);

      if (isImageGeneration && !imageToSend) {
        // Handle Image Generation
        const generatedImageBase64 = await generateImage(userText);
        
        setMessages(prev => prev.map(msg => 
          msg.id === placeholderId 
            ? { 
                ...msg, 
                content: `Here is the image for: "${userText}"`, 
                image: generatedImageBase64,
                isStreaming: false 
              } 
            : msg
        ));
      } else {
        // Handle Regular Chat
        const historyForContext = messages.filter(m => !m.isStreaming && m.content);

        await sendMessageStream(userText, imageToSend, historyForContext, (streamedText) => {
          setMessages(prev => prev.map(msg => 
            msg.id === placeholderId 
              ? { ...msg, content: streamedText } 
              : msg
          ));
        });
      }
      
      // Finalize message and save session
      setMessages(prev => {
        const finalized = prev.map(msg => 
          msg.id === placeholderId 
            ? { ...msg, isStreaming: false } 
            : msg
        );
        
        // Update Session History
        if (currentSessionId && user) {
          const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
          if (sessionIndex >= 0) {
            const updatedSessions = [...sessions];
            
            // Smart Title Generation
            let newTitle = updatedSessions[sessionIndex].title;
            if (newTitle === 'New Conversation') {
                if (imageToSend) {
                    newTitle = "Image Analysis";
                } else {
                    newTitle = userText.slice(0, 30) + (userText.length > 30 ? '...' : '');
                }
            }

            updatedSessions[sessionIndex] = {
              ...updatedSessions[sessionIndex],
              messages: finalized,
              title: newTitle,
              updatedAt: Date.now()
            };
            persistSessions(user.username, updatedSessions);
            setSessions(updatedSessions);
          }
        }
        return finalized;
      });

    } catch (error: any) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "I encountered an error.";
      
      setMessages(prev => prev.map(msg => 
        msg.id === placeholderId 
          ? { 
              ...msg, 
              content: `⚠️ **Error**: ${errorMessage}\n\nPlease try a different prompt.`, 
              isStreaming: false 
            } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // If not logged in, show Auth
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans selection:bg-hara-200 dark:selection:bg-hara-900 selection:text-hara-900 dark:selection:text-hara-100 transition-colors duration-300">
      
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={() => user && createNewSession(user.username)}
        onDeleteSession={handleDeleteSession}
        onLogout={handleLogout}
        username={user.username}
        isAdmin={user.isAdmin}
        onToggleAdmin={() => setShowAdminPanel(!showAdminPanel)}
        showAdminPanel={showAdminPanel}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 md:ml-72`}>
        {/* Header */}
        <header className="flex-shrink-0 h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 transition-colors duration-300">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
               <Menu size={20} />
             </button>
            <div className="flex items-center gap-2 group cursor-default">
              <Sparkles className="text-hara-600 dark:text-hara-500 w-5 h-5" />
              <h1 className="text-lg font-bold tracking-tight">
                Hara AI <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded ml-1 font-medium">1.0</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

             <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hara-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-hara-500"></span>
              </span>
              Online
            </div>
          </div>
        </header>

        {/* Content Area - Either Admin Panel or Chat */}
        {showAdminPanel ? (
            <AdminPanel />
        ) : (
            <>
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth p-3 md:p-4">
                  <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-end">
                    {messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in duration-700">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-tr from-hara-100 to-zinc-100 dark:from-hara-900 dark:to-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-hara-500/10 dark:shadow-hara-900/20">
                          <Zap className="w-6 h-6 md:w-8 md:h-8 text-hara-600 dark:text-hara-500" />
                        </div>
                        <h2 className="text-lg md:text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Welcome, {user.username}</h2>
                        <p className="text-zinc-500 dark:text-zinc-500 max-w-sm text-sm px-4">
                          Start a new conversation or select one from the history.
                        </p>
                        <div className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
                          Try "Generate image of a futuristic city"
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pb-2">
                        {messages.map((msg) => (
                          <ChatMessage key={msg.id} message={msg} username={user.username} />
                        ))}
                        
                        <div ref={messagesEndRef} className="h-4" />
                      </div>
                    )}
                  </div>
                </main>

                {/* Input Area */}
                <footer className="flex-shrink-0 p-3 pb-5 md:p-4 md:pb-8 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent dark:from-zinc-950 dark:via-zinc-950 z-10 transition-colors duration-300">
                  <div className="max-w-3xl mx-auto relative">
                    
                    {/* Image Preview */}
                    {selectedImage && (
                      <div className="absolute -top-24 left-0 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg animate-in slide-in-from-bottom-2 fade-in">
                        <div className="relative">
                          <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                          <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-2 -right-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-white rounded-full p-1 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`
                       relative group bg-white/80 dark:bg-zinc-900 rounded-2xl border transition-all shadow-lg backdrop-blur-sm
                       ${isListening ? 'border-red-500/50 shadow-red-500/10' : 'border-zinc-200 dark:border-zinc-800 focus-within:border-hara-500/50 focus-within:ring-1 focus-within:ring-hara-500/20'}
                    `}>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageSelect} 
                        className="hidden" 
                        accept="image/*"
                      />
                      
                      <div className="flex items-end">
                         <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3 text-zinc-500 dark:text-zinc-500 hover:text-hara-600 dark:hover:text-hara-400 transition-colors mb-1"
                          title="Upload Image"
                         >
                           <ImageIcon size={20} />
                         </button>

                         <button 
                          onClick={toggleListening}
                          className={`
                             p-3 mb-1 transition-all duration-200 relative
                             ${isListening ? 'text-red-500 scale-110' : 'text-zinc-500 dark:text-zinc-500 hover:text-hara-600 dark:hover:text-hara-400'}
                          `}
                          title={isListening ? "Stop listening" : "Voice Input"}
                         >
                           {isListening && (
                             <>
                                <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></span>
                                <span className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse"></span>
                             </>
                           )}
                           {isListening ? <MicOff size={20} className="relative z-10" /> : <Mic size={20} className="relative z-10" />}
                         </button>

                        <textarea
                          ref={inputRef}
                          value={input}
                          onChange={(e) => {
                            setInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder={isListening ? "Listening... (speak now)" : "Ask Hara AI or type 'generate image...'"}
                          className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-600 py-4 pr-14 rounded-2xl focus:outline-none resize-none max-h-[150px] min-h-[56px] leading-relaxed text-base"
                          rows={1}
                        />
                      </div>
                      
                      <div className="absolute right-2 bottom-2">
                        <button
                          onClick={() => handleSend()}
                          disabled={(!input.trim() && !selectedImage) || isLoading}
                          className={`
                            p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center
                            ${(input.trim() || selectedImage) && !isLoading 
                              ? 'bg-hara-600 hover:bg-hara-500 text-white shadow-lg shadow-hara-500/20 dark:shadow-hara-900/50 scale-100' 
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed scale-95 opacity-50'}
                          `}
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send size={20} className={input.trim() ? "translate-x-0.5" : ""} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </footer>
            </>
        )}
      </div>
    </div>
  );
}