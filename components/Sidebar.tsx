
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Film,
  Zap,
  Download,
  Globe,
  Music,
  Star,
  Check,
  X
} from 'lucide-react';
import { ChatSession, User, SettingsState } from '../types';
import { TRANSLATIONS } from '../constants';
import Logo from './Logo';

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  currentView: string;
  onViewChange: (view: string) => void;
  user: User;
  onLogout: () => void;
  settings: SettingsState;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat,
  currentView, onViewChange, user, onLogout, settings
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const t = TRANSLATIONS[settings.language].nav;

  const handleSaveRename = (chatId: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onRenameChat(chatId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <aside className={`relative flex flex-col h-full border-r border-white/5 glass-panel transition-all duration-500 z-30 ${isCollapsed ? 'w-20' : 'w-72 md:w-80'}`}>
      <div className="p-6 md:p-8 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-3">
          <Logo size={isCollapsed ? 32 : 44} />
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-none gradient-text">BurakAI</h1>
              <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-black text-blue-500/60 mt-1">Core Neural</span>
            </div>
          )}
        </div>
      </div>

      <nav className="px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {[
          { id: 'chat', label: 'Neural Chat', icon: <MessageSquare size={18} />, color: 'text-blue-400' },
          { id: 'stars', label: 'Yıldız Patlat', icon: <Star size={18} />, color: 'text-yellow-400' },
          { id: 'images', label: t.images, icon: <ImageIcon size={18} />, color: 'text-purple-400' },
          { id: 'web-builder', label: t.webBuilder, icon: <Globe size={18} />, color: 'text-emerald-400' },
          { id: 'settings', label: t.settings, icon: <SettingsIcon size={18} />, color: 'text-slate-400' },
          { id: 'downloads', label: t.downloads, icon: <Download size={18} />, color: 'text-emerald-400' },
        ].map((item) => (
          <button key={item.id} onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${currentView === item.id ? 'bg-white/10 ring-1 ring-white/10' : 'hover:bg-white/5'}`}>
            <span className={`${item.color} group-hover:scale-110 transition-all`}>{item.icon}</span>
            {!isCollapsed && <span className="font-bold text-xs md:text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      {isCollapsed ? (
        <div className="px-3 py-3 flex justify-center">
          <button 
            onClick={onNewChat}
            title={settings.language === 'tr' ? 'Yeni Sohbet' : 'New Chat'}
            className="p-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-all hover:scale-105"
          >
            <Plus size={18} />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 mt-4">
          <div className="px-6 py-2 flex items-center justify-between mb-2">
            <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{TRANSLATIONS[settings.language].nav.history}</h2>
            <button 
              onClick={onNewChat} 
              title={settings.language === 'tr' ? 'Yeni Sohbet' : 'New Chat'}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 text-[11px] font-bold transition-all hover:scale-105"
            >
              <Plus size={13} />
              <span>{settings.language === 'tr' ? 'Yeni' : 'New'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
            {chats.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-[11px] text-slate-500 font-medium">
                  {settings.language === 'tr' ? 'Henüz sohbet geçmişi yok' : 'No chat history'}
                </p>
                <button
                  onClick={onNewChat}
                  className="mt-2 text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1 text-[11px]"
                >
                  <Plus size={12} /> {settings.language === 'tr' ? 'Yeni Sohbet Başlat' : 'Start New Chat'}
                </button>
              </div>
            ) : (
              chats.map(chat => {
                const isActive = activeChatId === chat.id;
                const isEditing = editingId === chat.id;

                if (isEditing) {
                  return (
                    <div 
                      key={chat.id}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(chat.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 min-w-0 bg-transparent text-white text-xs font-bold focus:outline-none px-1"
                      />
                      <button
                        onClick={() => handleSaveRename(chat.id)}
                        className="p-1 hover:text-emerald-400 text-slate-300 transition-colors"
                        title="Kaydet"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 hover:text-red-400 text-slate-400 transition-colors"
                        title="İptal"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div 
                    key={chat.id} 
                    onClick={() => onSelectChat(chat.id)}
                    className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-blue-600/20 text-blue-100 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/5' 
                        : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare size={14} className={isActive ? 'text-blue-400 shrink-0' : 'text-slate-500 group-hover:text-slate-300 shrink-0'} />
                      <span className="truncate text-[12px] font-bold">
                        {chat.title || 'Yeni Sohbet'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(chat.id);
                          setEditValue(chat.title);
                        }}
                        className="p-1 hover:text-blue-400 text-slate-500 transition-colors"
                        title="Başlığı Düzenle"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                        title="Sohbeti Sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
          <div className={`w-10 h-10 rounded-xl ${user.plan === 'pro' ? 'bg-purple-600' : 'bg-blue-600'} flex items-center justify-center font-black`}>{user.name[0]}</div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black truncate">{user.name}</p>
                <p className="text-[9px] text-slate-500 font-bold truncate tracking-tight">{user.email}</p>
            </div>
          )}
          <button onClick={onLogout} className="text-slate-600 hover:text-red-400"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
