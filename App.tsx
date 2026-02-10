
import React, { useState, useEffect, useCallback } from 'react';
import { User, ChatSession, SettingsState, ImageGeneration, Language, Personality } from './types';
import { storageService } from './services/storageService';
import { DEFAULT_SETTINGS } from './constants';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ImageGenerator from './components/ImageGenerator';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(storageService.getUser());
  const [chats, setChats] = useState<ChatSession[]>(storageService.getChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [images, setImages] = useState<ImageGeneration[]>(storageService.getImages());
  const [settings, setSettings] = useState<SettingsState>(storageService.getSettings());
  const [view, setView] = useState<'chat' | 'images' | 'settings'>('chat');

  useEffect(() => {
    storageService.setUser(user);
  }, [user]);

  useEffect(() => {
    storageService.saveChats(chats);
  }, [chats]);

  useEffect(() => {
    storageService.saveImages(images);
  }, [images]);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  const handleLogout = () => {
    setUser(null);
    setActiveChatId(null);
    setView('chat');
  };

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setView('chat');
  };

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const renameChat = (id: string, newTitle: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const updateMessages = (chatId: string, messages: ChatSession['messages']) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages } : c));
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 ${settings.darkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        chats={chats} 
        activeChatId={activeChatId} 
        onSelectChat={(id) => { setActiveChatId(id); setView('chat'); }}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        currentView={view}
        onViewChange={setView}
        user={user}
        onLogout={handleLogout}
        settings={settings}
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {view === 'chat' && (
          <ChatView 
            chat={activeChat} 
            settings={settings} 
            onUpdateMessages={(msgs) => activeChatId && updateMessages(activeChatId, msgs)}
            onNewChat={createNewChat}
          />
        )}
        {view === 'images' && (
          <ImageGenerator 
            images={images} 
            onSaveImage={(img) => setImages(prev => [img, ...prev])} 
            onDeleteImage={(id) => setImages(prev => prev.filter(img => img.id !== id))}
            settings={settings}
          />
        )}
        {view === 'settings' && (
          <Settings 
            settings={settings} 
            onUpdateSettings={setSettings} 
            user={user}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
};

export default App;
