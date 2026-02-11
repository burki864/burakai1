
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, User as UserIcon, Plus, Loader2, AlertCircle, 
  Search, Globe, Camera, Image as ImageIcon, Paperclip, 
  X, ExternalLink, Zap, Video, FileText
} from 'lucide-react';
import { ChatSession, Message, SettingsState, Attachment } from '../types';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { TRANSLATIONS, INTENT_KEYWORDS } from '../constants';
import Logo from './Logo';
import GenerationAnimation from './GenerationAnimation';

interface ChatViewProps {
  chat?: ChatSession;
  settings: SettingsState;
  userPlan?: 'free' | 'pro';
  onUpdateMessages: (messages: Message[]) => void;
  onNewChat: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ chat, settings, userPlan = 'free', onUpdateMessages, onNewChat }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(settings.searchEnabled);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat?.messages, streamingMessage]);

  const detectIntent = (text: string): 'image' | 'video' | 'text' => {
    const lower = text.toLowerCase();
    if (INTENT_KEYWORDS.video.some(k => lower.includes(k))) return 'video';
    if (INTENT_KEYWORDS.image.some(k => lower.includes(k))) return 'image';
    return 'text';
  };

  const checkVideoRateLimit = (): boolean => {
    const lastTs = storageService.getLastVideoTimestamp();
    const now = Date.now();
    if (now - lastTs < 60000) {
      const remaining = Math.ceil((60000 - (now - lastTs)) / 1000);
      setError(`${TRANSLATIONS[settings.language].chat.rateLimit} (${remaining}s)`);
      return false;
    }
    return true;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; setShowCamera(true); }
    } catch (err) { setError("Vision Restricted."); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    setShowCamera(false);
  };

  const handleSend = async () => {
    const cleanInput = input.trim();
    if (!cleanInput && attachments.length === 0 || isTyping) return;

    const intent = detectIntent(cleanInput);
    if (intent === 'video' && !checkVideoRateLimit()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: cleanInput, timestamp: Date.now(), attachments: [...attachments] };
    const newMessages = [...(chat?.messages || []), userMsg];
    
    if (!chat) return onNewChat();
    onUpdateMessages(newMessages);
    setInput('');
    setAttachments([]);
    setIsTyping(true);
    setError(null);

    if (intent === 'image') {
      const genMsg: Message = { id: 'gen-'+Date.now(), role: 'assistant', content: '', timestamp: Date.now(), isGenerating: true, generationType: 'image' };
      onUpdateMessages([...newMessages, genMsg]);
      try {
        const url = await geminiService.generateImage(cleanInput);
        onUpdateMessages([...newMessages, { ...genMsg, isGenerating: false, imageUrl: url }]);
      } catch (e: any) { setError(e.message); onUpdateMessages(newMessages); }
      setIsTyping(false);
    } else if (intent === 'video') {
      const genMsg: Message = { id: 'gen-v-'+Date.now(), role: 'assistant', content: '', timestamp: Date.now(), isGenerating: true, generationType: 'video' };
      onUpdateMessages([...newMessages, genMsg]);
      try {
        storageService.setLastVideoTimestamp(Date.now());
        const res = await fetch('/api/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: cleanInput }) });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        onUpdateMessages([...newMessages, { ...genMsg, isGenerating: false, videoUrl: data.videoUrl }]);
      } catch (e: any) { setError(e.message); onUpdateMessages(newMessages); }
      setIsTyping(false);
    } else {
      try {
        let groundingUrls: any[] = [];
        const fullResponse = await geminiService.generateTextStream(cleanInput, newMessages, { ...settings, searchEnabled }, attachments, (chunk) => setStreamingMessage(prev => prev + chunk), (urls) => { groundingUrls = urls; });
        onUpdateMessages([...newMessages, { id: Date.now().toString(), role: 'assistant', content: fullResponse, timestamp: Date.now(), groundingUrls: groundingUrls.length > 0 ? groundingUrls : undefined }]);
      } catch (err: any) { setError(err.message); } finally { setIsTyping(false); setStreamingMessage(''); }
    }
  };

  const t = TRANSLATIONS[settings.language].chat;

  return (
    <div className={`flex-1 flex flex-col min-h-0 relative overflow-hidden transition-all ${isDraggingFile ? 'bg-blue-600/5 ring-2 ring-blue-500/20' : 'bg-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }} onDragLeave={() => setIsDraggingFile(false)}
      onDrop={(e) => { e.preventDefault(); setIsDraggingFile(false); }}>
      
      <header className="px-4 py-3 md:px-10 md:py-6 flex items-center justify-between glass-panel sticky top-0 z-20 border-b border-white/10">
        <div className="flex items-center gap-3 md:gap-4">
          <Logo size={32} className="md:w-12 md:h-12" />
          <div className="min-w-0">
            <h3 className="font-black text-sm md:text-2xl tracking-tighter leading-none truncate">{chat?.title || t.welcome}</h3>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[7px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">{searchEnabled ? t.searchOn : t.searchOff}</span>
               <span className="bg-blue-600/20 text-blue-400 text-[6px] md:text-[8px] font-black px-1.5 rounded-sm uppercase">Neural Core</span>
            </div>
          </div>
        </div>
        <button onClick={() => setSearchEnabled(!searchEnabled)} className={`p-1.5 md:p-3 rounded-lg transition-all flex items-center gap-2 font-black text-[8px] md:text-[10px] uppercase tracking-widest ${searchEnabled ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'bg-slate-900 text-slate-500'}`}>
            <Search size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Search</span>
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-16 space-y-8 md:space-y-12 custom-scrollbar">
        {!chat && (
            <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-12 py-8 md:py-24 animate-in fade-in zoom-in duration-500">
                <Logo size={100} className="mx-auto md:w-48 md:h-48" />
                <h2 className="text-4xl md:text-8xl font-black tracking-tighter leading-tight">{t.welcome}</h2>
                <p className="text-base md:text-3xl text-slate-500 font-bold px-4 max-w-2xl mx-auto">{t.subtitle}</p>
                <button onClick={onNewChat} className="px-10 py-4 md:px-14 md:py-6 rounded-2xl md:rounded-[3rem] bg-blue-600 text-white font-black text-lg md:text-2xl shadow-3xl hover:scale-105 active:scale-95 transition-transform duration-300">
                    {t.init}
                </button>
            </div>
        )}

        {chat?.messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 md:gap-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'glass-panel text-blue-400'}`}>
              {msg.role === 'user' ? <UserIcon size={14} className="md:w-8 md:h-8" /> : <Logo size={20} className="md:w-9 md:h-9" />}
            </div>
            <div className={`flex flex-col space-y-3 md:space-y-5 max-w-[88%] md:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.isGenerating && <GenerationAnimation type={msg.generationType || 'image'} />}
              
              {msg.imageUrl && <img src={msg.imageUrl} className="w-full max-w-[400px] rounded-2xl md:rounded-[3rem] shadow-2xl border border-white/10" />}
              
              {msg.videoUrl && (
                <video controls autoPlay loop playsInline className="w-full max-w-[600px] rounded-2xl md:rounded-[3rem] shadow-2xl border border-white/10">
                   <source src={msg.videoUrl} type="video/mp4" />
                </video>
              )}
              
              {msg.content && (
                <div className={`p-4 md:p-10 rounded-2xl md:rounded-[3.5rem] text-base md:text-2xl font-bold leading-relaxed shadow-xl chat-bubble ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'glass-panel border-white/5 text-slate-100'}`}>
                  {msg.content}
                </div>
              )}

              {msg.groundingUrls && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {msg.groundingUrls.map((url, i) => (
                        <a key={i} href={url.uri} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] md:text-xs font-black border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                            <Globe size={12} /> <span className="truncate max-w-[120px] md:max-w-xs">{url.title}</span> <ExternalLink size={10} />
                        </a>
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {streamingMessage && (
            <div className="flex gap-3 md:gap-8 max-w-5xl mx-auto">
                <div className="w-8 h-8 md:w-16 md:h-16 rounded-xl glass-panel flex items-center justify-center flex-shrink-0"><Logo size={18} /></div>
                <div className="p-4 md:p-10 rounded-2xl md:rounded-[3.5rem] glass-panel text-base md:text-2xl font-bold flex-1 shadow-xl text-slate-100 chat-bubble">
                  {streamingMessage}
                  <span className="inline-block w-2 h-5 ml-1 bg-blue-500 animate-pulse"></span>
                </div>
            </div>
        )}
      </div>

      <div className="p-4 md:p-10 bg-gradient-to-t from-slate-950 to-transparent">
        <div className="max-w-4xl mx-auto space-y-3">
            {error && <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] md:text-xs font-black flex items-center gap-2 animate-in fade-in slide-in-from-top-1"><AlertCircle size={14} /> {error}</div>}
            
            <div className="glass-panel rounded-2xl md:rounded-[3rem] border-white/10 p-2 md:p-4 shadow-3xl">
                <textarea rows={1} value={input}
                    onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`; }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={t.placeholder}
                    className="w-full bg-transparent border-none focus:ring-0 p-3 md:p-6 text-white font-bold text-lg md:text-3xl placeholder-slate-700 resize-none" />
                <div className="flex items-center justify-between px-2 md:px-6 py-2 md:py-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-500 hover:text-blue-400 transition-colors"><Paperclip size={20} className="md:w-6 md:h-6" /></button>
                        <button onClick={startCamera} className="p-2.5 text-slate-500 hover:text-purple-400 transition-colors"><Camera size={20} className="md:w-6 md:h-6" /></button>
                    </div>
                    <button onClick={handleSend} disabled={(!input.trim() && attachments.length === 0) || isTyping}
                        className={`w-11 h-11 md:w-16 md:h-16 rounded-xl md:rounded-[1.8rem] transition-all flex items-center justify-center ${(!input.trim() && attachments.length === 0) || isTyping ? 'bg-slate-900 text-slate-600' : 'bg-blue-600 text-white shadow-3xl hover:scale-105 active:scale-95'}`}>
                        {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="md:w-8 md:h-8" />}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <input type="file" multiple ref={fileInputRef} className="hidden" />
      {showCamera && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-3xl">
              <video ref={videoRef} autoPlay playsInline className="max-w-full rounded-2xl border border-white/10 shadow-3xl" />
              <div className="flex gap-6 mt-10">
                  <button onClick={stopCamera} className="p-5 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"><X size={24} /></button>
                  <button className="p-8 rounded-full bg-blue-600 border-4 border-white text-white shadow-2xl active:scale-90 transition-transform"><Camera size={28} /></button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatView;
