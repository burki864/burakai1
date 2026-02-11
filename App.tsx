
import React, { useState, useEffect } from 'react';
import { User, ChatSession, SettingsState, ImageGeneration, ThemeType, AppView } from './types';
import { storageService } from './services/storageService';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ImageGenerator from './components/ImageGenerator';
import VideoStudio from './components/VideoStudio';
import Settings from './components/Settings';
import BannedScreen from './components/BannedScreen';
import BackgroundTheme from './components/BackgroundTheme';
import { Menu, X } from 'lucide-react';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(storageService.getUser());
  const [chats, setChats] = useState<ChatSession[]>(storageService.getChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [images, setImages] = useState<ImageGeneration[]>(storageService.getImages());
  const [settings, setSettings] = useState<SettingsState>(storageService.getSettings());
  const [view, setView] = useState<AppView>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => storageService.setUser(user), [user]);
  useEffect(() => storageService.saveChats(chats), [chats]);
  useEffect(() => storageService.saveImages(images), [images]);
  useEffect(() => storageService.saveSettings(settings), [settings]);

  const handleLogout = () => { setUser(null); setActiveChatId(null); setView('chat'); };

  const createNewChat = () => {
    const newChat: ChatSession = { id: Date.now().toString(), title: 'New Neural Link', messages: [], createdAt: Date.now() };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setView('chat');
    setIsSidebarOpen(false);
  };

  // Fix: Access properties from the profile sub-object and parse the ban_until string into a timestamp
  const banExpiresAt = user?.profile?.ban_until ? new Date(user.profile.ban_until).getTime() : undefined;
  const isBanned = user?.profile?.banned || (banExpiresAt !== undefined && banExpiresAt > Date.now());
  
  if (isBanned) return <BannedScreen lang={settings.language} expiresAt={banExpiresAt} />;
  if (!user) return <Auth onLogin={setUser} />;

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 ${settings.darkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <BackgroundTheme theme={settings.activeTheme} />

      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="fixed top-4 right-4 z-[60] p-2 rounded-xl glass-panel border border-white/10 md:hidden">
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`fixed inset-y-0 left-0 z-50 md:relative transform transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Sidebar 
            chats={chats} activeChatId={activeChatId} 
            onSelectChat={(id) => { setActiveChatId(id); setView('chat'); setIsSidebarOpen(false); }}
            onNewChat={createNewChat} onDeleteChat={(id) => setChats(p => p.filter(c => c.id !== id))}
            onRenameChat={(id, title) => setChats(p => p.map(c => c.id === id ? { ...c, title } : c))}
            currentView={view} onViewChange={(v) => { setView(v as any); setIsSidebarOpen(false); }}
            user={user} onLogout={handleLogout} settings={settings}
        />
      </div>
      
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" />}

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {view === 'chat' && <ChatView chat={activeChat} settings={settings} user={user} onUpdateMessages={(msgs) => activeChatId && setChats(p => p.map(c => c.id === activeChatId ? { ...c, messages: msgs } : c))} onNewChat={createNewChat} />}
        {view === 'images' && <ImageGenerator images={images} onSaveImage={(img) => setImages(p => [img, ...p])} onDeleteImage={(id) => setImages(p => p.filter(i => i.id !== id))} settings={settings} />}
        {view === 'video-studio' && <VideoStudio settings={settings} userPlan={user.plan} />}
        {view === 'settings' && <Settings settings={settings} onUpdateSettings={setSettings} user={user} onLogout={handleLogout} />}
      </main>
    </div>
  );
};

export default App;
