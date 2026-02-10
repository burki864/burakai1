
import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot, Copy, RefreshCw, Terminal, Check, Info, Plus, MessageSquare, Sparkles, Cpu, AlertCircle, Loader2, ArrowDown, X } from 'lucide-react';
import { ChatSession, Message, SettingsState } from '../types';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/supabase';
import { TRANSLATIONS } from '../constants';
import Logo from './Logo';

interface Toast {
  id: string;
  message: string;
}

interface ChatViewProps {
  chat?: ChatSession;
  settings: SettingsState;
  onUpdateMessages: (messages: Message[]) => void;
  onNewChat: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  chat,
  settings,
  onUpdateMessages,
  onNewChat
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Anti-spam and Profanity references
  const lastMessageRef = useRef({ text: '', count: 0 });
  const profanityList = ['aptal', 'salak', 'gerizekalı', 'mal', 'küfür'];

  useEffect(() => {
    if (scrollRef.current && !showScrollButton) {
      const scrollHeight = scrollRef.current.scrollHeight;
      scrollRef.current.scrollTo({ 
        top: scrollHeight, 
        behavior: isTyping ? 'auto' : 'smooth' 
      });
    }
  }, [chat?.messages, streamingMessage, isTyping]);

  const showToast = (message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 400);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ 
      top: scrollRef.current.scrollHeight, 
      behavior: 'smooth' 
    });
    setShowScrollButton(false);
  };

  const handleSend = async () => {
    const cleanInput = input.trim();
    if (!cleanInput || isTyping) return;

    // 1. Profanity Filter
    if (profanityList.some(word => cleanInput.toLowerCase().includes(word))) {
      showToast('⚠️ Küfür kullanamazsın!');
      return;
    }

    // 2. Spam Filter (Block after 3 consecutive identical messages)
    if (cleanInput === lastMessageRef.current.text) {
      lastMessageRef.current.count++;
      if (lastMessageRef.current.count > 3) {
        showToast('⚠️ Spam yapamazsın!');
        return;
      }
    } else {
      lastMessageRef.current.text = cleanInput;
      lastMessageRef.current.count = 1;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: cleanInput,
      timestamp: Date.now()
    };

    const currentMessages = chat?.messages || [];
    
    // 3. Message History Limit (Max 100)
    const newMessages = [...currentMessages, userMsg].slice(-100);
    
    if (!chat) {
        onNewChat();
        return;
    }

    onUpdateMessages(newMessages);
    setInput('');
    setIsTyping(true);
    setStreamingMessage('');
    setError(null);

    try {
      dbService.saveMessage('current-user', chat.id, 'user', userMsg.content).catch(() => {});

      const fullResponse = await geminiService.generateTextStream(
        userMsg.content,
        newMessages,
        settings,
        (chunk) => setStreamingMessage(prev => prev + chunk)
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now()
      };

      dbService.saveMessage('current-user', chat.id, 'assistant', assistantMsg.content).catch(() => {});
      
      // Keep assistant response in 100 msg limit
      onUpdateMessages([...newMessages, assistantMsg].slice(-100));
    } catch (err: any) {
      setError(err.message || "Neural connection failed.");
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
    }
  };

  const t = TRANSLATIONS[settings.language].chat;

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#010409] overflow-y-auto custom-scrollbar">
        <div className="relative mb-20 group">
            <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full animate-glow"></div>
            <Logo size={240} className="animate-float" />
        </div>
        <h2 className="text-8xl font-black mb-6 tracking-tighter">{t.welcome.split(' ')[0]} <span className="gradient-text">{t.welcome.split(' ')[1]}</span></h2>
        <p className="text-slate-500 max-w-2xl mb-16 text-2xl font-bold leading-relaxed opacity-90 tracking-tight">
            {t.subtitle}
        </p>
        <button 
          onClick={onNewChat}
          className="px-16 py-7 rounded-[2.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black transition-all shadow-[0_0_80px_rgba(37,99,235,0.4)] active:scale-[0.98] flex items-center gap-6 text-3xl"
        >
          <Plus size={40} /> {t.init}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#010409] relative">
      <header className="px-10 py-7 flex items-center justify-between glass-panel sticky top-6 z-20 mx-8 mt-6 rounded-[2.5rem] border-white/10 shadow-3xl">
        <div className="flex items-center gap-6">
          <Logo size={54} />
          <div>
            <h3 className="font-black text-2xl tracking-tighter leading-none">{chat.title}</h3>
            <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">{t.uplink}</p>
            </div>
          </div>
        </div>
      </header>

      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-10 py-16 space-y-16 custom-scrollbar relative"
      >
        {chat.messages.map((msg) => (
          <div key={msg.id} className={`flex gap-8 max-w-6xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-3xl border border-white/10 ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white' : 'glass-panel text-blue-400'}`}>
              {msg.role === 'user' ? <UserIcon size={32} /> : <Logo size={36} />}
            </div>
            <div className={`flex flex-col space-y-4 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`relative group p-10 rounded-[3rem] transition-all leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white border-white/10 shadow-xl' : 'glass-panel border-white/5 shadow-inner'}`}>
                <div className="prose prose-invert max-w-none text-xl font-bold whitespace-pre-wrap tracking-tight leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && streamingMessage && (
          <div className="flex gap-8 max-w-6xl mx-auto">
            <div className="w-16 h-16 rounded-3xl glass-panel flex items-center justify-center flex-shrink-0 text-blue-400 shadow-3xl border-white/10 animate-pulse">
              <Logo size={36} />
            </div>
            <div className="p-10 rounded-[3rem] glass-panel border-white/5 max-w-[80%] shadow-inner relative overflow-hidden">
              <div className="prose prose-invert max-w-none text-xl font-bold leading-relaxed whitespace-pre-wrap tracking-tight">
                {streamingMessage}
                <span className="inline-block w-3 h-8 bg-blue-500 ml-3 animate-pulse rounded-full align-middle" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto p-8 glass-panel border-red-500/40 rounded-3xl flex items-center gap-6 text-red-400">
            <AlertCircle size={32} />
            <p className="font-black text-lg uppercase tracking-widest">{error}</p>
          </div>
        )}
      </div>

      <div className="p-10 md:p-16 sticky bottom-0 z-10 bg-gradient-to-t from-[#010409] via-[#010409]/95 to-transparent">
        <div className="max-w-6xl mx-auto relative group">
          <div className="relative glass-panel rounded-[3.5rem] border-white/10 p-4 flex items-end gap-6 shadow-2xl focus-within:border-blue-500/50 transition-all">
            <textarea 
              rows={1} value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 400)}px`; }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={t.placeholder}
              className="flex-1 bg-transparent border-none focus:ring-0 p-6 text-white font-black resize-none text-2xl placeholder-slate-700 custom-scrollbar leading-relaxed"
            />
            <button 
              onClick={handleSend} disabled={!input.trim() || isTyping}
              className={`w-24 h-24 rounded-[2.5rem] transition-all flex items-center justify-center flex-shrink-0 mb-2 ${!input.trim() || isTyping ? 'bg-slate-900 text-slate-700' : 'bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-3xl active:scale-90'}`}
            >
              {isTyping ? <Loader2 className="animate-spin" size={44} /> : <Send size={44} />}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className="animate-toast bg-slate-900 border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]"
          >
            <AlertCircle className="text-blue-400" size={24} />
            <p className="font-bold text-lg">{toast.message}</p>
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default ChatView;
