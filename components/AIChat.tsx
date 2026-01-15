
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2, Sparkles, User, Globe, Moon, ShieldCheck } from 'lucide-react';
import { getTravelAdvice } from '../services/geminiService';

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Bonjour ! Je suis votre assistant Cheap Travel. Comment puis-je vous aider aujourd\'hui ? (Visa, Omrah, Vols...)' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await getTravelAdvice(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Oups, j'ai rencontré un petit problème. Veuillez réessayer." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Trigger Button - Using highest z-index for visibility */}
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="fixed bottom-10 left-10 z-[1000] w-16 h-16 bg-blue-900 text-white rounded-full shadow-[0_10px_40px_rgba(30,58,138,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
          aria-label="Ouvrir l'assistant IA"
        >
          <Bot size={28} />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <Sparkles size={10} className="text-white" />
          </div>
          <div className="absolute left-full ml-4 bg-white px-4 py-2 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-gray-100">
             <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Assistant IA</p>
          </div>
        </button>
      )}

      {/* Chat Window - Elevated z-index to ensure it is always on top of other fixed elements */}
      {isOpen && (
        <div className="fixed bottom-10 left-10 z-[1000] w-[calc(100%-40px)] max-w-[400px] h-[600px] max-h-[calc(100vh-80px)] bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.4)] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
          
          {/* Header */}
          <div className="bg-blue-900 p-6 md:p-8 text-white flex justify-between items-center relative overflow-hidden shrink-0">
             {/* Background Decoration */}
             <div className="absolute -top-4 -right-4 p-4 opacity-10 pointer-events-none select-none">
                <Bot size={120} />
             </div>

             <div className="relative z-10 flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                   <Bot size={24} className="text-orange-400" />
                </div>
                <div>
                   <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <h3 className="text-lg font-black tracking-tighter uppercase italic">Cheap <span className="text-orange-500">AI</span></h3>
                   </div>
                   <p className="text-blue-200 text-[9px] font-black uppercase tracking-[0.2em]">Assistant Virtuel</p>
                </div>
             </div>

             {/* Close Button - Enhanced with specific z-index and event propagation block */}
             <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }} 
              className="relative z-[1001] p-3 bg-white/10 hover:bg-orange-500 hover:text-white rounded-2xl transition-all active:scale-90"
              aria-label="Fermer le chat"
              title="Fermer l'assistant"
             >
                <X size={24} />
             </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-900 text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-gray-100 flex items-center space-x-2">
                  <Loader2 size={16} className="animate-spin text-orange-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">L'IA prépare une réponse...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-100 bg-white shrink-0">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-900/10 transition-all border border-transparent focus-within:border-blue-900/20">
              <input 
                type="text" 
                placeholder="Comment puis-je vous aider ?" 
                className="flex-1 bg-transparent border-none focus:outline-none px-4 py-2 text-sm font-medium text-gray-700 placeholder:text-gray-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 bg-blue-900 text-white rounded-xl flex items-center justify-center hover:bg-black active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-blue-900/10"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[8px] text-gray-400 text-center mt-3 uppercase font-bold tracking-widest">Alimenté par Google Gemini AI</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
