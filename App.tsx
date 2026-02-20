
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChatSession, SettingsState, ImageGeneration, ThemeType, AppView } from './types';
import { storageService } from './services/storageService';
import { dbService } from './services/supabase'; // dbService'i içe aktar
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ImageGenerator from './components/ImageGenerator';
import VideoStudio from './components/VideoStudio';
import Settings from './components/Settings';
import Downloads from './components/Downloads';
import BannedScreen from './components/BannedScreen';
import MouseGlow from './components/MouseGlow';
import IntroAnimation from './components/IntroAnimation';
import { Menu, X, Zap } from 'lucide-react';

const MotionDiv = motion.div as any;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(storageService.getUser());
  const [showIntro, setShowIntro] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>(storageService.getChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [images, setImages] = useState<ImageGeneration[]>(storageService.getImages());
  const [settings, setSettings] = useState<SettingsState>(storageService.getSettings());
  const [view, setView] = useState<AppView>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API key on mount and when user changes
  useEffect(() => {
    const checkApiKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const selected = await aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // Fallback for local dev if not in AI Studio environment
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, [user]);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };
  
  // Ban durumu için yeni state'ler
  const [banStatus, setBanStatus] = useState<{ isBanned: boolean; expiresAt?: number }>({
    isBanned: false,
    expiresAt: undefined
  });
  const [banReason, setBanReason] = useState<string | undefined>(undefined);
  const [isSecurityLoading, setIsSecurityLoading] = useState(true);

  useEffect(() => storageService.setUser(user), [user]);
  useEffect(() => storageService.saveChats(chats), [chats]);
  useEffect(() => storageService.saveImages(images), [images]);
  useEffect(() => storageService.saveSettings(settings), [settings]);

  // CANLI BAN KONTROLÜ
  useEffect(() => {
    const verifyAccess = async () => {
      if (user?.id) {
        setIsSecurityLoading(true);
        const status = await dbService.checkBanStatus(user.id);
        
        // If profile deleted on Supabase, logout
        if (!status.exists) {
          handleLogout();
          setIsSecurityLoading(false);
          return;
        }

        setBanStatus({ isBanned: status.isBanned, expiresAt: status.expiresAt });
        setBanReason(status.reason);
        setIsSecurityLoading(false);
      } else {
        setIsSecurityLoading(false);
      }
    };
    verifyAccess();
  }, [user?.id]);

  // Tema Renk Ayarları
  useEffect(() => {
    const themeColors: Record<ThemeType, { primary: string; secondary: string; glow: string }> = {
      default: { primary: '#3b82f6', secondary: '#a855f7', glow: 'rgba(59, 130, 246, 0.5)' },
      rain: { primary: '#22d3ee', secondary: '#3b82f6', glow: 'rgba(34, 211, 238, 0.5)' },
      desert: { primary: '#f97316', secondary: '#fbbf24', glow: 'rgba(249, 115, 22, 0.5)' },
      nebula: { primary: '#a855f7', secondary: '#ec4899', glow: 'rgba(168, 85, 247, 0.5)' },
      cyberpunk: { primary: '#06b6d4', secondary: '#f472b6', glow: 'rgba(6, 182, 212, 0.5)' },
      snow: { primary: '#94a3b8', secondary: '#cbd5e1', glow: 'rgba(148, 163, 184, 0.5)' },
    };

    const colors = themeColors[settings.activeTheme] || themeColors.default;
    document.documentElement.style.setProperty('--accent-primary', colors.primary);
    document.documentElement.style.setProperty('--accent-secondary', colors.secondary);
    document.documentElement.style.setProperty('--accent-glow', colors.glow);
  }, [settings.activeTheme]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setShowIntro(true);
  };

  const handleLogout = () => { 
    setUser(null); 
    setActiveChatId(null); 
    setView('chat'); 
    setShowIntro(false); 
    setBanStatus({ isBanned: false, expiresAt: undefined });
    setBanReason(undefined);
    storageService.setUser(null);
  };

  const createNewChat = () => {
    const newChat: ChatSession = { id: Date.now().toString(), title: 'New Neural Link', messages: [], createdAt: Date.now() };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setView('chat');
    setIsSidebarOpen(false);
  };

  // Güvenlik katmanı: Banlıysa her şeyi durdur ve ekranı göster
  if (banStatus.isBanned) {
    return <BannedScreen lang={settings.language} expiresAt={banStatus.expiresAt} reason={banReason} />;
  }

  // Kullanıcı yoksa Login ekranı
  if (!user) return <Auth onLogin={handleLogin} />;

  // API Key seçilmemişse zorunlu ekran
  if (!hasApiKey) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-panel p-10 rounded-[3rem] border-white/10 text-center space-y-8">
          <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto text-blue-400">
            <Zap size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tighter">Neural Uplink Required</h2>
            <p className="text-slate-400 font-bold leading-relaxed">
              To access high-performance synthesis (Gemini Pro & Veo), you must connect your Gemini API key.
            </p>
            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-[10px] text-blue-400/60 font-mono uppercase tracking-widest">
              Billing must be enabled on your Google Cloud project.
            </div>
          </div>
          <button 
            onClick={handleSelectKey}
            className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-3xl hover:scale-[1.02] transition-all active:scale-95"
          >
            Connect Gemini API
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-[10px] text-slate-600 hover:text-blue-400 font-black uppercase tracking-[0.2em] transition-colors"
          >
            View Billing Documentation
          </a>
        </div>
      </div>
    );
  }

  // Güvenlik kontrolü yapılırken kısa bir yükleme ekranı (opsiyonel)
  if (isSecurityLoading) return <div className="h-screen w-full bg-slate-950 flex items-center justify-center font-mono text-blue-500 animate-pulse">Neural Link Verifying...</div>;

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className={`flex h-[100dvh] w-full transition-all duration-500 overflow-hidden relative ${settings.darkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <MouseGlow />

      <AnimatePresence>
        {showIntro && (
          <IntroAnimation 
            userName={user.name} 
            onComplete={() => setShowIntro(false)} 
          />
        )}
      </AnimatePresence>

      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="fixed top-3.5 right-4 z-[60] p-2.5 rounded-xl glass-panel border border-white/10 md:hidden transition-transform active:scale-90 shadow-2xl">
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`fixed inset-y-0 left-0 z-50 md:relative transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl md:shadow-none`}>
        <Sidebar 
            chats={chats} activeChatId={activeChatId} 
            onSelectChat={(id) => { setActiveChatId(id); setView('chat'); setIsSidebarOpen(false); }}
            onNewChat={createNewChat} onDeleteChat={(id) => setChats(p => p.filter(c => c.id !== id))}
            onRenameChat={(id, title) => setChats(p => p.map(c => c.id === id ? { ...c, title } : c))}
            currentView={view} onViewChange={(v) => { setView(v as any); setIsSidebarOpen(false); }}
            user={user} onLogout={handleLogout} settings={settings}
        />
      </div>
      
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300" />}

      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        <AnimatePresence mode="wait">
          {!showIntro && (
            <MotionDiv
              key={view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex-1 h-full"
            >
              {view === 'chat' && <ChatView chat={activeChat} settings={settings} user={user} onUpdateMessages={(msgs) => activeChatId && setChats(p => p.map(c => c.id === activeChatId ? { ...c, messages: msgs } : c))} onNewChat={createNewChat} />}
              {view === 'images' && <ImageGenerator images={images} onSaveImage={(img) => setImages(p => [img, ...p])} onDeleteImage={(id) => setImages(p => p.filter(i => i.id !== id))} settings={settings} user={user} />}
              {view === 'video-studio' && <VideoStudio settings={settings} user={user} />}
              {view === 'settings' && <Settings settings={settings} onUpdateSettings={setSettings} user={user} onLogout={handleLogout} onUpdateUser={setUser} />}
              {view === 'downloads' && <Downloads settings={settings} />}
            </MotionDiv>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
