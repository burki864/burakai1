import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, User as UserIcon, Plus, Loader2, AlertCircle, 
  Search, Globe, Camera, Image as ImageIcon, Paperclip, 
  X, ExternalLink, Zap, Video, FileText, MessageSquare,
  File as FileIcon, FileImage, Mic, MicOff, Play,
  Telescope, Beaker, Copy, Check, Sparkles, Code, Music,
  Layout, Youtube, Search as SearchIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatSession, Message, SettingsState, Attachment, User } from '../types';
import { aiService } from '../services/aiService';
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
  onSaveImage?: (img: any) => void;
  onSetAnalysisContext?: (res: any) => void;
  points: number;
  spendPoints: (amount: number) => boolean;
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const displayLanguage = language || 'code';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-white/10 shadow-2xl group glass-panel">
      <div className="bg-white/5 px-4 py-2 text-[10px] text-slate-400 border-b border-white/10 flex justify-between items-center">
        <span className="font-black uppercase tracking-widest">{displayLanguage}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-blue-400 transition-colors font-bold"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">COPIED</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={atomDark}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.85rem', background: 'transparent' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const ChatView: React.FC<ChatViewProps> = ({ 
  chat, settings, user, onUpdateMessages, onNewChat, onSaveImage, onSetAnalysisContext, points, spendPoints 
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
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

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: Attachment[] = [];
    
    for (const file of Array.from(files)) {
      try {
        const att = await new Promise<Attachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result !== 'string') return reject(new Error("Dosya okunamadı"));
            const data = result.split(',')[1];
            resolve({
              type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
              data, 
              mimeType: file.type, 
              name: file.name
            });
          };
          reader.onerror = () => reject(new Error("Okuma hatası"));
          reader.readAsDataURL(file);
        });
        newAttachments.push(att);
      } catch (err) {
        console.error("Dosya yükleme hatası:", err);
        setError("Bazı dosyalar yüklenemedi.");
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Inputu temizle ki aynı dosya tekrar seçilebilsin
  };

  const handleSend = async () => {
    const cleanInput = input.trim();
    if ((!cleanInput && attachments.length === 0) || isTyping) return;

    if (points < 1) {
      setError("Yetersiz Puan! (Mesaj göndermek için 1 Coin gerekir)");
      return;
    }

    if (!chat) {
        onNewChat();
        return;
    }

    const route = await aiService.routeRequest(cleanInput, attachments);
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: cleanInput, 
      timestamp: Date.now(), 
      attachments: [...attachments] 
    };
    
    const newMessages = [...(chat.messages || []), userMsg];
    onUpdateMessages(newMessages);
    spendPoints(1);
    saveToSupabase(user.id, cleanInput, 'user').catch(e => console.debug(e));

    setInput('');
    setAttachments([]);
    setIsTyping(true);
    setError(null);

    try {
      let responseText = "";
      let assistantMsg: Message = { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: '', 
        timestamp: Date.now() 
      };

      if (route === 'IMAGE_CREATE') {
        assistantMsg.isGenerating = true;
        assistantMsg.generationType = 'image';
        onUpdateMessages([...newMessages, assistantMsg]);
        const url = await aiService.generateImage(cleanInput.replace(/^\/image\s*/i, ''));
        onUpdateMessages([...newMessages, { ...assistantMsg, isGenerating: false, imageUrl: url }]);
        
        // Global galeriye ekle
        if (onSaveImage) {
          onSaveImage({
            id: Date.now().toString(),
            prompt: cleanInput,
            url: url,
            timestamp: Date.now()
          });
        }

        dbService.saveImage(user.id, cleanInput, url).catch(e => console.debug(e));
        return;
      } 
      
      // Analysis Routes
      if (route === 'IMAGE_ANALYZE' || route === 'VIDEO_ANALYZE') {
        setStreamingMessage("Analyzing visual content...");
        const result = await aiService.analyzeVision(cleanInput, attachments);
        if (onSetAnalysisContext) onSetAnalysisContext({ type: 'vision', data: result, timestamp: Date.now() });
        responseText = `### Analysis Results\n\n${result.analysis}\n\n**Design Observations:**\n- ${result.designObservations.join('\n- ')}\n\n**Suggested Improvements:**\n- ${result.suggestedImprovements.join('\n- ')}`;
      } 
      else if (route === 'LINK_ANALYZE') {
        const url = cleanInput.match(/(https?:\/\/[^\s]+)/g)?.[0] || "";
        setStreamingMessage(`Inspecting ${url}...`);
        const result = await aiService.analyzeLink(url);
        if (onSetAnalysisContext) onSetAnalysisContext({ type: 'link', data: result, timestamp: Date.now() });
        responseText = `### Website Analysis: ${result.title}\n\n${result.summary}\n\n**Design Language:** ${result.designLanguage}\n**Color Palette:** ${result.colorPalette.join(', ')}\n\n**Hierarchy:**\n- ${result.hierarchy.join('\n- ')}`;
      }
      else if (route === 'YOUTUBE_ANALYZE') {
        const url = cleanInput.match(/(https?:\/\/[^\s]+)/g)?.[0] || "";
        setStreamingMessage(`Analyzing YouTube content...`);
        const result = await aiService.analyzeYouTube(url);
        if (onSetAnalysisContext) onSetAnalysisContext({ type: 'youtube', data: result, timestamp: Date.now() });
        responseText = `### YouTube Analysis\n\n${result.summary}\n\n**Key Takeaways:**\n- ${result.keyTakeaways.join('\n- ')}\n\n**Landing Page Concept:**\n- **Title:** ${result.landingPageConcept.title}\n- **Hero:** ${result.landingPageConcept.heroText}`;
      }
      else if (route === 'WEB_SEARCH') {
        setStreamingMessage("Searching the web for latest info...");
        const result = await aiService.webSearch(cleanInput.replace(/^\/search\s*/i, ''));
        responseText = `### Web Search Results\n\n${result.summary}\n\n**Sources:**\n${result.sources.map((s: any) => `- [${s.title}](${s.url})`).join('\n')}`;
      }
      else if (route === 'WEB_BUILD_CREATE') {
        setStreamingMessage("Drafting website structure...");
        const result = await aiService.generateWebsite(cleanInput.replace(/^\/web\s*/i, ''));
        responseText = `### Web Siteniz Hazırlandı! 🚀\n\n**Başlık:** ${result.title}\n**Açıklama:** ${result.description}\n\n**Oluşturulan Bölümler:**\n${result.sections.map((s: any) => `- **${s.name}**: ${s.content}`).join('\n')}\n\nWeb sitenizin tam kodunu görmek ve düzenlemek için sol menüden **"Web Builder"** sekmesine gidebilirsiniz.`;
      }
      else {
        // Default Chat
        responseText = await aiService.generateText(
          cleanInput, 
          newMessages.slice(-6), 
          settings,
          (chunk) => setStreamingMessage(prev => prev + chunk)
        );
      }

      if (responseText) {
        // Parse for generation commands [GENERATE: TYPE, PROMPT]
        const genMatch = responseText.match(/\[GENERATE:\s*(\w+),\s*(.*?)\]/i);
        
        if (genMatch) {
          const type = genMatch[1].toUpperCase();
          const prompt = genMatch[2];
          
          if (type === 'IMAGE') {
            const url = await aiService.generateImage(prompt);
            onUpdateMessages([...newMessages, { 
              ...assistantMsg, 
              content: responseText.replace(genMatch[0], ''), 
              imageUrl: url 
            }]);
            return;
          }
          
          if (type === 'WEBSITE') {
            window.dispatchEvent(new CustomEvent('generate-website-section', { 
              detail: { type: 'General', prompt } 
            }));
            onUpdateMessages([...newMessages, { 
              ...assistantMsg, 
              content: responseText.replace(genMatch[0], '') + "\n\n🚀 **Web Builder** modülüne bir bölüm eklendi! Sol menüden kontrol edebilirsiniz.", 
            }]);
            return;
          }
        }

        onUpdateMessages([...newMessages, { 
          ...assistantMsg,
          content: responseText, 
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
          <div className="w-full max-w-4xl mx-auto text-center py-20 space-y-12">
            <div className="relative inline-block">
              <Logo size={160} className="mx-auto opacity-30 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-blue-500 animate-bounce" size={48} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter gradient-text">Core Neural</h2>
              <p className="text-slate-400 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
                Unified AI Workspace. Chat, create, analyze, and build from a single interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {[
                { icon: <SearchIcon size={20} />, text: "Latest AI news this week", cmd: "/search latest AI news" },
                { icon: <ImageIcon size={20} />, text: "Generate a cyberpunk city", cmd: "/image a cyberpunk city" },
                { icon: <Layout size={20} />, text: "Build a SaaS landing page", cmd: "/build-web SaaS landing page" },
                { icon: <Youtube size={20} />, text: "Summarize a YouTube video", cmd: "/link [URL]" },
              ].map((starter, i) => (
                <button 
                  key={i}
                  onClick={() => { onNewChat(); setInput(starter.cmd); }}
                  className="flex items-center gap-4 p-6 rounded-[2rem] glass-panel border border-white/5 hover:bg-white/10 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    {starter.icon}
                  </div>
                  <span className="font-bold text-slate-200">{starter.text}</span>
                </button>
              ))}
            </div>

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
              
              {msg.imageUrl && (
                <img 
                  src={msg.imageUrl} 
                  className="max-w-md w-full rounded-3xl shadow-2xl border border-white/10" 
                  alt={msg.content || "Output"} 
                  referrerPolicy="no-referrer"
                />
              )}
              {msg.videoUrl && <video controls className="max-w-xl w-full rounded-3xl shadow-2xl"><source src={msg.videoUrl} /></video>}
              {msg.audioUrl && (
                <div className="w-full max-w-md p-4 glass-panel rounded-2xl border border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                    <Music size={24} />
                  </div>
                  <audio controls className="flex-1 h-8 accent-blue-600">
                    <source src={msg.audioUrl} type="audio/mpeg" />
                  </audio>
                </div>
              )}

              {msg.content && (
                <div className={`p-5 md:p-8 rounded-[2rem] text-sm md:text-xl font-medium shadow-xl leading-relaxed max-w-[90%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'glass-panel text-slate-100 rounded-tl-none'}`}>
                  <ReactMarkdown
                    components={{
                      pre({ children }) {
                        return <>{children}</>;
                      },
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isBlock = !!match || String(children).includes('\n');
                        
                        if (isBlock) {
                          return (
                            <CodeBlock
                              language={match ? match[1] : 'code'}
                              value={String(children).replace(/\n$/, '')}
                              {...props}
                            />
                          );
                        }
                        return (
                          <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {streamingMessage && (
          <div className="flex gap-4 max-w-5xl mx-auto">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl glass-panel flex items-center justify-center shrink-0"><Logo size={24} /></div>
            <div className="p-5 md:p-8 rounded-[2rem] glass-panel text-sm md:text-xl font-medium flex-1 text-slate-100 leading-relaxed animate-in fade-in">
              <ReactMarkdown
                components={{
                  pre({ children }) {
                    return <>{children}</>;
                  },
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isBlock = !!match || String(children).includes('\n');
                    
                    if (isBlock) {
                      return (
                        <CodeBlock
                          language={match ? match[1] : 'code'}
                          value={String(children).replace(/\n$/, '')}
                          {...props}
                        />
                      );
                    }
                    return (
                      <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {streamingMessage}
              </ReactMarkdown>
              <span className="inline-block w-2 h-5 ml-1 bg-blue-500 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <div className="relative z-20 p-4 md:p-10">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* DOSYA ÖNİZLEME PANELİ */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-wrap gap-3 p-4 glass-panel rounded-3xl border border-white/10"
              >
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative group w-20 h-20 md:w-24 md:h-24">
                    {file.type === 'image' ? (
                      <img 
                        src={`data:${file.mimeType};base64,${file.data}`} 
                        className="w-full h-full object-cover rounded-xl border border-white/10"
                        alt="preview"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10">
                        {file.type === 'video' ? <Video className="text-blue-400" size={24} /> : <FileIcon className="text-blue-400" size={24} />}
                        <span className="text-[10px] mt-1 px-1 truncate w-full text-center text-slate-300">{file.name}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-30"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

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
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-blue-400 transition-colors"><Paperclip size={20}/></button>
                <button onClick={startSpeechRecognition} className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-blue-400'}`}><Mic size={20} /></button>
              </div>
              <button onClick={handleSend} disabled={isTyping} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-2xl hover:scale-105 transition-transform disabled:opacity-50">
                {isTyping ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                {!isTyping && <span className="text-[8px] font-black mt-1 opacity-70">-1</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        multiple 
        accept="image/*,video/*,.pdf,.doc,.docx,.txt" 
      />
    </div>
  );
};

export default ChatView;