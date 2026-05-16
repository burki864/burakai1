import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChatSession, SettingsState, ImageGeneration, ThemeType, AppView } from './types';
import { storageService } from './services/storageService';
import { dbService } from './services/supabase'; 
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ImageGenerator from './components/ImageGenerator';
import AIWebsiteBuilder from './components/AIWebsiteBuilder';
import Settings from './components/Settings';
import Downloads from './components/Downloads';
import BannedScreen from './components/BannedScreen';
import MouseGlow from './components/MouseGlow';
import IntroAnimation from './components/IntroAnimation';
import { Menu, X, Coins, Star } from 'lucide-react';
import { usePoints, COST_IMAGE } from './hooks/usePoints';
import StarExplosion from './components/StarExplosion';
import { AnalysisResult } from './types';

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
  const [analysisContext, setAnalysisContext] = useState<AnalysisResult[]>([]);

  // Hugging Face geçişi yapıldığı için API Key kontrolü kaldırıldı.
  // Uygulama her zaman "bağlı" kabul edilecek.

  // Ban durumu için state'ler
  const [banStatus, setBanStatus] = useState<{ isBanned: boolean; expiresAt?: number }>({
    isBanned: false,
    expiresAt: undefined
  });
  const [banReason, setBanReason] = useState<string | undefined>(undefined);
  const [isSecurityLoading, setIsSecurityLoading] = useState(true);

  const { points, spendPoints, canClaimDaily, claimDaily } = usePoints();

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

  // Güvenlik kontrolü yapılırken kısa bir yükleme ekranı
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

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2 rounded-2xl glass-panel border border-white/10 shadow-2xl">
        <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-500">
          <Coins size={16} />
        </div>
        <span className="text-sm font-black tracking-tighter text-yellow-500">
          {points.toFixed(1)} <span className="text-[10px] opacity-50">COIN</span>
        </span>
      </div>

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
              {view === 'chat' && (
                <ChatView 
                  chat={activeChat} 
                  settings={settings} 
                  user={user} 
                  onUpdateMessages={(msgs) => activeChatId && setChats(p => p.map(c => c.id === activeChatId ? { ...c, messages: msgs } : c))} 
                  onNewChat={createNewChat}
                  onSaveImage={(img) => setImages(p => [img, ...p])}
                  onSetAnalysisContext={(res) => setAnalysisContext(p => [...p, res])}
                  points={points}
                  spendPoints={spendPoints}
                />
              )}
              {view === 'images' && (
                <ImageGenerator 
                  images={images} 
                  onSaveImage={(img) => setImages(p => [img, ...p])} 
                  onDeleteImage={(id) => setImages(p => p.filter(i => i.id !== id))} 
                  settings={settings} 
                  user={user} 
                  points={points}
                  spendPoints={spendPoints}
                />
              )}
              {view === 'stars' && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="max-w-md w-full glass-panel border border-white/10 rounded-[3rem] p-12 flex flex-col items-center gap-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 rounded-3xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-2xl shadow-yellow-500/10 mb-4">
                        <Star size={48} fill="currentColor" />
                      </div>
                      <h2 className="text-4xl font-black tracking-tighter">YILDIZ PATLAT</h2>
                      <p className="text-white/40 font-medium text-sm">Her gün yeni bir yıldız keşfet ve puanlarını topla!</p>
                    </div>

                    <StarExplosion 
                      disabled={!canClaimDaily()} 
                      onExplode={(amount) => claimDaily(amount)} 
                    />

                    {!canClaimDaily() && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest"
                      >
                        Bugünlük keşif tamamlandı. Yarın tekrar gel!
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
              {view === 'web-builder' && (
                <AIWebsiteBuilder 
                  points={points}
                  spendPoints={spendPoints}
                />
              )}
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
;