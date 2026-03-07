import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User as UserIcon, Plus, Loader2, AlertCircle, 
  Search, Globe, Camera, Image as ImageIcon, Paperclip, 
  X, ExternalLink, Zap, Video, FileText, MessageSquare,
  File as FileIcon, FileImage, Mic, MicOff, Play,
  Telescope, Beaker
} from 'lucide-react';
import { ChatSession, Message, SettingsState, Attachment, User } from '../types';
import { aiService } from '../services/aiService'; // Yeni servis
import { sendMessage as saveToSupabase, dbService } from '../services/supabase';
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
  const [isResearchMode, setIsResearchMode] = useState(false);
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
      setError("Tarayıcınız ses tanımayı desteklemiyor.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = settings.language === 'tr' ? 'tr-TR' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' : '') + transcript);
    };
    recognition.start();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const att = await new Promise<Attachment>((resolve) => {
        reader.onload = (ev) => {
          const data = (ev.target?.result as string).split(',')[1];
          resolve({
            type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
            data, mimeType: file.type, name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
      newAttachments.push(att);
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleSend = async () => {
    const cleanInput = input.trim();
    if ((!cleanInput && attachments.length === 0) || isTyping) return;

    if (!chat) {
        onNewChat();
        return;
    }

    const intent = detectIntent(cleanInput);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: cleanInput, timestamp: Date.now(), attachments: [...attachments] };
    const newMessages = [...(chat.messages || []), userMsg];
    
    onUpdateMessages(newMessages);
    saveToSupabase(user.id, cleanInput, 'user').catch(e => console.debug(e));

    setInput('');
    setAttachments([]);
    setIsTyping(true);
    setError(null);

    try {
      if (intent === 'image') {
        const genMsg: Message = { id: 'img-' + Date.now(), role: 'assistant', content: '', timestamp: Date.now(), isGenerating: true, generationType: 'image' };
        onUpdateMessages([...newMessages, genMsg]);
        const url = await aiService.generateImage(cleanInput);
        onUpdateMessages([...newMessages, { ...genMsg, isGenerating: false, imageUrl: url }]);
        dbService.saveImage(user.id, cleanInput, url).catch(e => console.debug(e));
      } 
      else if (intent === 'video') {
        const genMsg: Message = { id: 'vid-' + Date.now(), role: 'assistant', content: '', timestamp: Date.now(), isGenerating: true, generationType: 'video' };
        onUpdateMessages([...newMessages, genMsg]);
        const url = await aiService.generateVideo(cleanInput);
        onUpdateMessages([...newMessages, { ...genMsg, isGenerating: false, videoUrl: url }]);
        dbService.saveVideo(user.id, cleanInput, url).catch(e => console.debug(e));
      } 
      else {
        // Metin Yanıtı
        const responseText = await aiService.generateText(
          cleanInput, 
          newMessages.slice(-6), 
          settings,
          (chunk) => setStreamingMessage(prev => prev + chunk)
        );

        onUpdateMessages([...newMessages, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: responseText, 
          timestamp: Date.now() 
        }]);
        saveToSupabase(user.id, responseText, 'assistant').catch(e => console.debug(e));
      }
    } catch (err: any) {
      setError(err.message || "Bir bağlantı hatası oluştu.");
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
    }
  };

  const t = TRANSLATIONS[settings.language].chat;

  return (
    <div className={`flex-1 flex flex-col min-h-0 relative h-full transition-colors ${isDraggingFile ? 'bg-blue-600/5' : 'bg-transparent'}`}>
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <BackgroundTheme theme={settings.activeTheme} />
      </div>
      
      <header className="relative z-20 px-4 py-3 md:px-8 border-b border-white/10 glass-panel flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <div>
            <h3 className="font-black text-sm md:text-xl truncate">{chat?.title || t.welcome}</h3>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Hugging Face Link Active</span>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 md:px-10 py-6 space-y-6 custom-scrollbar">
        {!chat && (
          <div className="w-full max-w-4xl mx-auto text-center py-20 space-y-8">
            <Logo size={120} className="mx-auto opacity-20" />
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter">{t.welcome}</h2>
            <button onClick={onNewChat} className="px-12 py-5 rounded-full bg-blue-600 text-white font-black text-xl shadow-2xl hover:scale-105 transition-transform">
              {t.init}
            </button>
          </div>
        )}

        {chat?.messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-5xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-blue-600' : 'glass-panel text-blue-400'}`}>
              {msg.role === 'user' ? <UserIcon size={24} /> : <Logo size={28} />}
            </div>
            
            <div className={`flex flex-col space-y-3 w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.isGenerating && <GenerationAnimation type={msg.generationType || 'image'} />}
              
              {msg.imageUrl && <img src={msg.imageUrl} className="max-w-md w-full rounded-3xl shadow-2xl border border-white/10" alt="Output" />}
              {msg.videoUrl && <video controls className="max-w-xl w-full rounded-3xl shadow-2xl"><source src={msg.videoUrl} /></video>}

              {msg.content && (
                <div className={`p-5 md:p-8 rounded-[2rem] text-sm md:text-xl font-medium shadow-xl whitespace-pre-wrap leading-relaxed max-w-[90%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'glass-panel text-slate-100 rounded-tl-none'}`}>
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {streamingMessage && (
          <div className="flex gap-4 max-w-5xl mx-auto">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl glass-panel flex items-center justify-center shrink-0"><Logo size={24} /></div>
            <div className="p-5 md:p-8 rounded-[2rem] glass-panel text-sm md:text-xl font-medium flex-1 text-slate-100 whitespace-pre-wrap leading-relaxed animate-in fade-in">
              {streamingMessage}<span className="inline-block w-2 h-5 ml-1 bg-blue-500 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="relative z-20 p-4 md:p-10">
        <div className="max-w-4xl mx-auto space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}
          
          <div className="glass-panel rounded-[2.5rem] border-white/10 p-2 md:p-4 shadow-3xl">
            <textarea 
              rows={1} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={t.placeholder}
              className="w-full bg-transparent border-none focus:ring-0 p-4 text-white text-lg md:text-2xl placeholder-slate-700 resize-none" 
            />
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/5">
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-blue-400"><Paperclip size={20}/></button>
                <button onClick={startSpeechRecognition} className={`p-2 ${isListening ? 'text-red-500' : 'text-slate-500'}`}><Mic size={20} /></button>
              </div>
              <button onClick={handleSend} disabled={isTyping} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
                {isTyping ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,video/*" />
    </div>
  );
};

export default ChatView;