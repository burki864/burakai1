
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
  Menu,
  Sparkles
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
  currentView: 'chat' | 'images' | 'settings';
  onViewChange: (view: 'chat' | 'images' | 'settings') => void;
  user: User;
  onLogout: () => void;
  settings: SettingsState;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  currentView,
  onViewChange,
  user,
  onLogout,
  settings
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const t = TRANSLATIONS[settings.language].nav;

  const handleStartRename = (e: React.MouseEvent, chat: ChatSession) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditValue(chat.title);
  };

  const handleFinishRename = (id: string) => {
    onRenameChat(id, editValue);
    setEditingId(null);
  };

  return (
    <aside className={`relative flex flex-col h-full border-r border-white/5 glass-panel transition-all duration-500 ease-in-out z-30 ${isCollapsed ? 'w-20' : 'w-80'}`}>
      {/* Brand Section */}
      <div className="p-8 flex items-center gap-4 overflow-hidden">
        <Logo size={isCollapsed ? 32 : 44} />
        {!isCollapsed && (
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter leading-none gradient-text">BurakAI</h1>
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-500/60 mt-1">{t.proCore}</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="px-4 py-4 space-y-2">
        {[
          { id: 'chat', label: t.chat, icon: <MessageSquare size={20} />, color: 'text-blue-400' },
          { id: 'images', label: t.images, icon: <ImageIcon size={20} />, color: 'text-purple-400' },
          { id: 'settings', label: t.settings, icon: <SettingsIcon size={20} />, color: 'text-slate-400' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => onViewChange(item.id as any)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] transition-all group ${currentView === item.id ? 'bg-white/10 ring-1 ring-white/10 shadow-lg' : 'hover:bg-white/5'}`}
          >
            <span className={`${item.color} group-hover:scale-110 transition-transform duration-300`}>
              {item.icon}
            </span>
            {!isCollapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="mx-6 my-6 h-px bg-white/5" />

      {/* Chat History Container */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-8 py-2 flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.history}</h2>
            <button 
              onClick={onNewChat}
              className="p-1.5 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-all active:scale-90"
              title={t.newChat}
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
            {chats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all ${activeChatId === chat.id ? 'bg-blue-600/10 text-blue-100 ring-1 ring-blue-500/20 shadow-xl' : 'hover:bg-white/5 text-slate-500 hover:text-slate-300'}`}
              >
                <div className={`w-2 h-2 rounded-full transition-all ${activeChatId === chat.id ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`}></div>
                {editingId === chat.id ? (
                  <input 
                    autoFocus
                    className="bg-transparent border-none focus:outline-none w-full text-sm font-bold"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleFinishRename(chat.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(chat.id)}
                  />
                ) : (
                  <span className="truncate text-sm font-bold flex-1">{chat.title}</span>
                )}
                
                {activeChatId === chat.id && !editingId && (
                  <div className="hidden group-hover:flex items-center gap-2">
                    <button onClick={(e) => handleStartRename(e, chat)} className="p-1 hover:text-white"><Edit3 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }} className="p-1 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Section */}
      <div className="p-6">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} p-3 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group cursor-pointer`}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:rotate-12 transition-transform">
            {user.name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate tracking-tight">{user.email}</p>
            </div>
          )}
          {!isCollapsed && (
            <button onClick={onLogout} className="text-slate-600 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Handle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-12 rounded-full glass-panel border border-white/10 flex items-center justify-center hover:bg-slate-800 transition-all z-50 shadow-xl"
      >
        {isCollapsed ? <ChevronRight size={14} className="text-blue-400" /> : <ChevronLeft size={14} className="text-blue-400" />}
      </button>
    </aside>
  );
};

export default Sidebar;
