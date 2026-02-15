
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
  Download
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

  return (
    <aside className={`relative flex flex-col h-full border-r border-white/5 glass-panel transition-all duration-500 z-30 ${isCollapsed ? 'w-20' : 'w-72 md:w-80'}`}>
      <div className="p-6 md:p-8 flex items-center gap-3 overflow-hidden">
        <Logo size={isCollapsed ? 32 : 44} />
        {!isCollapsed && (
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-none gradient-text">BurakAI</h1>
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-black text-blue-500/60 mt-1">Core Neural</span>
          </div>
        )}
      </div>

      <nav className="px-4 py-2 space-y-1">
        {[
          { id: 'chat', label: t.chat, icon: <MessageSquare size={18} />, color: 'text-blue-400' },
          { id: 'images', label: t.images, icon: <ImageIcon size={18} />, color: 'text-purple-400' },
          { id: 'video-studio', label: t.videoStudio, icon: <Film size={18} />, color: 'text-cyan-400' },
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

      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 mt-6">
          <div className="px-6 py-2 flex items-center justify-between mb-2">
            <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{TRANSLATIONS[settings.language].nav.history}</h2>
            <button onClick={onNewChat} className="p-1.5 hover:bg-blue-500/10 rounded-lg text-blue-400"><Plus size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
            {chats.map(chat => (
              <div key={chat.id} onClick={() => onSelectChat(chat.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${activeChatId === chat.id ? 'bg-blue-600/10 text-blue-100 ring-1 ring-blue-500/20' : 'hover:bg-white/5 text-slate-500'}`}>
                <span className="truncate text-[11px] md:text-[13px] font-bold">{chat.title}</span>
              </div>
            ))}
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
