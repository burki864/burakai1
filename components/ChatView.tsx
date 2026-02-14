
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User as UserIcon, Plus, Loader2, AlertCircle, 
  Search, Globe, Camera, Image as ImageIcon, Paperclip, 
  X, ExternalLink, Zap, Video, FileText, MessageSquare,
  File as FileIcon, FileImage, Mic, MicOff, Play
} from 'lucide-react';
import { ChatSession, Message, SettingsState, Attachment, User } from '../types';
import { geminiService } from '../services/geminiService';
import { TRANSLATIONS, INTENT_KEYWORDS } from '../constants';
import Logo from './Logo';
import GenerationAnimation from './GenerationAnimation';
import BackgroundTheme from './BackgroundTheme';
import FeedbackModal from './FeedbackModal';

interface ChatViewProps {
  chat?: ChatSession;
  settings: SettingsState;
  user: User;
  onUpdateMessages: (messages: Message[]) => void;
  onNewChat: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ chat, settings, user, onUpdateMessages, onNewChat }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ 
        top: scrollRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [chat?.messages, streamingMessage]);

  const detectIntent = (text: string): 'image' | 'video' | 'text' => {
    const lower = text.toLowerCase();
    if (INTENT_KEYWORDS.video.some(k => lower.includes(k))) return 'video';
    if (INTENT_KEYWORDS.image.some(k => lower.includes(k))) return 'image';
    return 'text';
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = settings.language === 'tr' ? 'tr-TR' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setError("Speech error: " + event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' : '') + transcript);
    };

    recognition.start();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const attachmentPromise = new Promise<Attachment>((resolve) => {
        reader.onload = (event) => {
          const base64Data = (event.target?.result as string).split(',')[1];
          let type: 'image' | 'video' | 'file' = 'file';
          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('video/')) type = 'video';

          resolve({
            type,
            data: base64Data,
            mimeType: file.type || 'application/octet-stream',
            name: file.name
          });
        };
      });
      reader.readAsDataURL(file);
      newAttachments.push(await attachmentPromise);
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const cleanInput = input.trim();
    if ((!cleanInput && attachments.length === 0) || isTyping) return;

    if (!chat) {
        onNewChat();
        setTimeout(() => setError("Neural Link Initialized. Please re-send your command."), 100);
        return;
    }

    const intent = detectIntent(cleanInput);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: cleanInput, timestamp: Date.now(), attachments: [...attachments] };
    const currentMessages = chat.messages || [];
    const newMessages = [...currentMessages, userMsg];
    onUpdateMessages(newMessages);
    setInput('');
    setAttachments([]);
    setIsTyping(true);
    setError(null);

    if (intent === 'image') {
      const genMsg: Message = { id: 'gen-' + Date.now(), role: 'assistant', content: '', timestamp: Date.now(), isGenerating: true, generationType: 'image' };
      onUpdateMessages([...newMessages, genMsg]);
      try {
        const url = await geminiService.generateImage(cleanInput);
        onUpdateMessages([...newMessages, { ...genMsg, isGenerating: false, imageUrl: url }]);
      } catch (e: any) { setError(e.message); onUpdateMessages(newMessages); }
      setIsTyping(false);
    } else if (intent === 'video') {
      const genMsg: Message = { id: 'gen-v-' + Date.now(), role: 'assistant', content: '', timestamp: Date.now(), isGenerating: true, generationType: 'video' };
      onUpdateMessages([...newMessages, genMsg]);
      try {
        const url = await geminiService.generateVideo(cleanInput, user.id, '16:9');
        onUpdateMessages([...newMessages, { ...genMsg, isGenerating: false, videoUrl: url }]);
      } catch (e: any) { setError(e.message); onUpdateMessages(newMessages); }
      setIsTyping(false);
    } else {
      try {
        const fullResponse = await geminiService.generateTextStream(cleanInput, newMessages, settings, userMsg.attachments || [], (chunk) => setStreamingMessage(prev => prev + chunk));
        onUpdateMessages([...newMessages, { id: Date.now().toString(), role: 'assistant', content: fullResponse, timestamp: Date.now() }]);
      } catch (err: any) { setError(err.message); } finally { setIsTyping(false); setStreamingMessage(''); }
    }
  };

  const t = TRANSLATIONS[settings.language].chat;

  return (
    <div 
      className={`flex-1 flex flex-col min-h-0 relative overflow-hidden transition-all h-full ${isDraggingFile ? 'bg-blue-600/5' : 'bg-transparent'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }} 
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
    >
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        <BackgroundTheme theme={settings.activeTheme} />
      </div>
      
      <header className="relative z-10 px-4 py-3 md:px-8 lg:px-10 md:py-6 flex items-center justify-between glass-panel border-b border-white/10">
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <Logo size={32} className="md:w-10 lg:w-12 shrink-0" />
          <div className="min-w-0">
            <h3 className="font-black text-sm sm:text-lg md:text-xl lg:text-2xl tracking-tighter leading-none truncate">{chat?.title || t.welcome}</h3>
            <div className="flex items-center gap-2 mt-0.5 md:mt-1">
               <span className="text-[7px] sm:text-[8px] md:text-[10px] text-blue-400 font-bold uppercase tracking-widest">Neural Link Active</span>
            </div>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 md:px-10 py-6 md:py-12 lg:py-16 space-y-6 md:space-y-10 custom-scrollbar">
        {!chat && (
            <div className="w-full max-w-4xl mx-auto text-center space-y-6 md:space-y-10 py-10 md:py-24">
                <Logo size={80} className="mx-auto sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-48 lg:h-48" />
                <div className="space-y-2 md:space-y-4">
                  <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-tight">{t.welcome}</h2>
                  <p className="text-sm sm:text-xl md:text-2xl lg:text-3xl text-slate-500 font-bold px-4 max-w-2xl mx-auto">{t.subtitle}</p>
                </div>
                <button onClick={onNewChat} className="px-8 py-3 sm:px-10 sm:py-4 md:px-14 md:py-6 rounded-xl sm:rounded-2xl md:rounded-[3rem] bg-blue-600 text-white font-black text-base sm:text-lg md:text-2xl shadow-3xl transition-all">
                    {t.init}
                </button>
            </div>
        )}

        {chat?.messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 sm:gap-4 md:gap-8 max-w-5xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'glass-panel text-blue-400'}`}>
              {msg.role === 'user' ? <UserIcon size={14} className="sm:w-5 sm:h-5 md:w-7 md:h-7" /> : <Logo size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8" />}
            </div>
            <div className={`flex flex-col space-y-2 sm:space-y-3 md:space-y-5 w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.isGenerating && <GenerationAnimation type={msg.generationType || 'image'} />}
              
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={`flex flex-wrap gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.attachments.map((att, i) => (
                    <div key={i} className="max-w-[200px] rounded-xl overflow-hidden glass-panel border border-white/10 shadow-lg">
                      {att.type === 'image' ? (
                        <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-auto object-cover max-h-40" alt="Attachment" />
                      ) : att.type === 'video' ? (
                        <div className="p-3 flex items-center gap-2 text-xs font-bold text-slate-300">
                          <Video size={16} className="text-cyan-400" />
                          <span className="truncate">{att.name || 'Video'}</span>
                        </div>
                      ) : (
                        <div className="p-3 flex items-center gap-2 text-xs font-bold text-slate-300">
                          <FileIcon size={16} className="text-blue-400" />
                          <span className="truncate">{att.name || 'File'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {msg.imageUrl && <div className="w-full max-w-[400px]"><img src={msg.imageUrl} className="w-full aspect-square object-cover rounded-[2rem] shadow-2xl border border-white/10" alt="Neural" /></div>}
              {msg.videoUrl && <div className="w-full max-w-[600px] rounded-[2rem] overflow-hidden shadow-2xl"><video controls autoPlay loop className="w-full"><source src={msg.videoUrl} type="video/mp4" /></video></div>}
              {msg.content && (
                <div className={`p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] text-sm sm:text-base md:text-xl lg:text-2xl font-bold shadow-xl chat-bubble max-w-[88%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'glass-panel text-slate-100 rounded-tl-none'}`}>
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {streamingMessage && (
            <div className="flex gap-3 sm:gap-4 md:gap-8 max-w-5xl mx-auto">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl md:rounded-2xl glass-panel flex items-center justify-center flex-shrink-0"><Logo size={18} /></div>
                <div className="p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] glass-panel text-sm sm:text-base md:text-xl lg:text-2xl font-bold flex-1 shadow-xl text-slate-100 rounded-tl-none">
                  {streamingMessage}<span className="inline-block w-2 h-5 ml-1 bg-blue-500 animate-pulse"></span>
                </div>
            </div>
        )}
      </div>

      <div className="relative z-10 px-4 pb-4 sm:px-6 sm:pb-6 md:px-10 md:pb-10 bg-gradient-to-t from-slate-950/80 to-transparent">
        <div className="max-w-4xl mx-auto space-y-2 md:space-y-4">
            {error && <div className="p-2 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black flex items-center gap-2"><AlertCircle size={14}/><span>{error}</span></div>}
            
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-wrap gap-2 mb-2 p-2"
                >
                  {attachments.map((att, i) => (
                    <div key={i} className="relative group p-2 glass-panel border border-blue-500/30 rounded-xl flex items-center gap-2 pr-8 animate-in fade-in slide-in-from-bottom-2">
                      {att.type === 'image' ? <FileImage size={14} className="text-blue-400" /> : att.type === 'video' ? <Video size={14} className="text-cyan-400" /> : <FileIcon size={14} className="text-blue-400" />}
                      <span className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]">{att.name}</span>
                      <button 
                        onClick={() => removeAttachment(i)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="glass-panel rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] border-white/10 p-1.5 md:p-4 shadow-3xl">
                <textarea 
                    rows={1} value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={t.placeholder}
                    className="w-full bg-transparent border-none focus:ring-0 p-3 sm:p-4 md:p-6 text-white font-bold text-base sm:text-lg md:text-2xl placeholder-slate-700 resize-none" />
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                          multiple 
                          accept="image/*,video/*,application/pdf,text/plain"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-slate-500 hover:text-blue-400 transition-all hover:scale-110"
                        >
                          <Paperclip size={18}/>
                        </button>
                        <button 
                          onClick={startSpeechRecognition}
                          className={`p-2 transition-all hover:scale-110 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-blue-400'}`}
                        >
                          {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                        </button>
                        <button 
                          onClick={() => setIsFeedbackOpen(true)}
                          className="p-2 text-slate-500 hover:text-purple-400 flex items-center gap-1.5 transition-colors group"
                        >
                          <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Feedback</span>
                        </button>
                    </div>
                    <button 
                        onClick={handleSend} 
                        disabled={(!input.trim() && attachments.length === 0) || isTyping}
                        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl md:rounded-[1.8rem] transition-all flex items-center justify-center ${(!input.trim() && attachments.length === 0) || isTyping ? 'bg-slate-900 text-slate-600' : 'bg-blue-600 text-white shadow-3xl hover:scale-105'}`}>
                        {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        userName={user.name} 
      />
    </div>
  );
};

export default ChatView;
