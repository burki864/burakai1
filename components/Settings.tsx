
import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Globe, 
  Moon, 
  Sun, 
  Shield, 
  Bell, 
  LogOut, 
  Cpu,
  Type as TypeIcon,
  Palette,
  CloudRain,
  Sun as SunIcon,
  Zap,
  Box,
  Sparkles,
  Save,
  Loader2,
  CheckCircle,
  Search,
  Clock,
  Layout
} from 'lucide-react';
import { SettingsState, User, Language, Personality, ThemeType } from '../types';
import { TRANSLATIONS } from '../constants';
import { updateProfile } from '../services/supabase';

interface SettingsProps {
  settings: SettingsState;
  onUpdateSettings: (settings: SettingsState) => void;
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  user,
  onLogout,
  onUpdateUser
}) => {
  const [username, setUsername] = useState(user.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[settings.language].settings;

  const update = (key: keyof SettingsState, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const handleProfileUpdate = async () => {
    if (!username.trim() || isUpdating) return;
    setIsUpdating(true);
    setSuccess(false);
    setError(null);

    try {
      await updateProfile(user.id, { username: username.trim() });
      onUpdateUser({
        ...user,
        name: username.trim(),
        profile: user.profile ? { ...user.profile, username: username.trim() } : undefined
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const themes: { id: ThemeType; icon: React.ReactNode; label: string; colorClass: string; activeColor: string }[] = [
    { id: 'default', icon: <Box size={18} />, label: 'Standard', colorClass: 'text-blue-400', activeColor: 'bg-blue-600/20 border-blue-500 shadow-blue-500/20' },
    { id: 'rain', icon: <CloudRain size={18} />, label: 'Rain Fall', colorClass: 'text-cyan-400', activeColor: 'bg-cyan-600/20 border-cyan-500 shadow-cyan-500/20' },
    { id: 'desert', icon: <SunIcon size={18} />, label: 'Sahara', colorClass: 'text-orange-400', activeColor: 'bg-orange-600/20 border-orange-500 shadow-orange-500/20' },
    { id: 'nebula', icon: <Sparkles size={18} />, label: 'Deep Space', colorClass: 'text-purple-400', activeColor: 'bg-purple-600/20 border-purple-500 shadow-purple-500/20' },
    { id: 'cyberpunk', icon: <Zap size={18} />, label: 'Neon Grid', colorClass: 'text-pink-400', activeColor: 'bg-pink-600/20 border-pink-500 shadow-pink-500/20' }
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto custom-scrollbar bg-transparent">
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-24 md:pb-32">
        
        {/* Profile Section */}
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-500/20 text-blue-400">
              <UserIcon size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{t.profile}</h2>
              <p className="text-slate-500 text-[9px] sm:text-sm font-bold uppercase tracking-widest">{t.profileSub}</p>
            </div>
          </div>
          
          <div className="p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem] glass-panel border-white/5 space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-3xl sm:text-4xl font-black shadow-2xl shrink-0 transition-theme">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Handle</label>
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg font-bold focus:border-[var(--accent-primary)] outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <p className="text-slate-500 font-bold text-xs sm:text-sm ml-1 truncate max-w-full">{user.email}</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    {user.plan.toUpperCase()} NODE
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={handleProfileUpdate}
              disabled={isUpdating || username === user.name}
              className={`w-full flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-xl sm:rounded-3xl transition-all font-black uppercase tracking-widest border border-white/5 shadow-xl text-xs sm:text-base ${username === user.name ? 'opacity-30 cursor-not-allowed' : 'bg-[var(--accent-primary)] hover:opacity-90 text-white active:scale-95'}`}
              style={{ backgroundColor: username !== user.name ? 'var(--accent-primary)' : undefined }}
            >
              {isUpdating ? <Loader2 size={18} className="animate-spin" /> : success ? <CheckCircle size={18} /> : <Save size={18} />}
              {isUpdating ? 'Synchronizing...' : success ? 'Records Updated' : 'Commit Changes'}
            </button>
          </div>
        </section>

        {/* Atmosphere / Theme Section */}
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-500/20 text-indigo-400">
              <Palette size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{t.theme}</h2>
              <p className="text-slate-500 text-[9px] sm:text-sm font-bold uppercase tracking-widest">{t.themeSub}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {themes.map((theme) => (
              <button 
                key={theme.id}
                onClick={() => update('activeTheme', theme.id)}
                className={`flex flex-col items-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl sm:rounded-[2rem] border transition-all relative overflow-hidden group ${settings.activeTheme === theme.id ? theme.activeColor + ' scale-105' : 'glass-panel border-white/5 text-slate-500 hover:bg-white/5'}`}
              >
                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 transition-transform group-hover:scale-110 ${settings.activeTheme === theme.id ? theme.colorClass : ''}`}>
                  {/* Fixed TS error by casting theme.icon to React.ReactElement<any> to allow size prop injection */}
                  {React.cloneElement(theme.icon as React.ReactElement<any>, { size: 16 })}
                </div>
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center">{theme.label}</span>
                {settings.activeTheme === theme.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 accent-bg" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Global Protocol Toggles */}
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-purple-500/20 text-purple-400">
              <Shield size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Protocols</h2>
              <p className="text-slate-500 text-[9px] sm:text-sm font-bold uppercase tracking-widest">Global Directives</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {/* Dark Mode */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] glass-panel border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400 shrink-0">
                  {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs sm:text-sm uppercase tracking-tight truncate">Night Protocol</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">Dark Mode UI</p>
                </div>
              </div>
              <button 
                onClick={() => update('darkMode', !settings.darkMode)}
                className={`w-12 h-6 sm:w-14 sm:h-8 rounded-full p-1 transition-colors shrink-0 ${settings.darkMode ? 'bg-[var(--accent-primary)]' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6 sm:translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Search Grounding */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] glass-panel border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400 shrink-0">
                  <Search size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs sm:text-sm uppercase tracking-tight truncate">Neural Grounding</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">Web Search Access</p>
                </div>
              </div>
              <button 
                onClick={() => update('searchEnabled', !settings.searchEnabled)}
                className={`w-12 h-6 sm:w-14 sm:h-8 rounded-full p-1 transition-colors shrink-0 ${settings.searchEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white transition-transform ${settings.searchEnabled ? 'translate-x-6 sm:translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Timestamps */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] glass-panel border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400 shrink-0">
                  <Clock size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs sm:text-sm uppercase tracking-tight truncate">Temporal Logic</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">Message Timestamps</p>
                </div>
              </div>
              <button 
                onClick={() => update('showTimestamps', !settings.showTimestamps)}
                className={`w-12 h-6 sm:w-14 sm:h-8 rounded-full p-1 transition-colors shrink-0 ${settings.showTimestamps ? 'bg-[var(--accent-primary)]' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white transition-transform ${settings.showTimestamps ? 'translate-x-6 sm:translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

             {/* Language Selection */}
             <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] glass-panel border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400 shrink-0">
                  <Globe size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs sm:text-sm uppercase tracking-tight truncate">Linguistic Node</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">Primary Language</p>
                </div>
              </div>
              <select 
                value={settings.language}
                onChange={(e) => update('language', e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-black outline-none uppercase tracking-widest shrink-0"
              >
                {Object.values(Language).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Advanced Model Parameters */}
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-cyan-500/20 text-cyan-400">
              <Cpu size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{t.aiEngine}</h2>
              <p className="text-slate-500 text-[9px] sm:text-sm font-bold uppercase tracking-widest">{t.aiEngineSub}</p>
            </div>
          </div>
          
          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] glass-panel border-white/5 space-y-8 md:space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] flex items-center gap-2 sm:gap-3">
                <TypeIcon size={14} className="text-slate-500" /> Behavioral Pattern
              </label>
              <select 
                value={settings.personality}
                onChange={(e) => update('personality', e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black outline-none uppercase tracking-widest"
              >
                {Object.values(Personality).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <label className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em]">Entropy Level (Creativity)</label>
                <span className="text-xs sm:text-sm font-mono text-[var(--accent-primary)] font-black px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/10">{(settings.creativity * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" value={settings.creativity}
                onChange={(e) => update('creativity', parseFloat(e.target.value))}
                className="w-full h-1.5 sm:h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer shadow-inner"
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <div className="flex justify-between text-[7px] sm:text-[8px] font-black text-slate-600 uppercase tracking-widest">
                <span>Deterministic</span>
                <span>Hallucinogenic</span>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <label className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] block">Core Directives (System Prompt)</label>
              <textarea 
                value={settings.systemPrompt}
                onChange={(e) => update('systemPrompt', e.target.value)}
                rows={4}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-xs sm:text-sm font-bold focus:border-[var(--accent-primary)] outline-none resize-none transition-all leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex flex-col gap-3 sm:gap-4 pt-4">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] bg-slate-900 hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-400 font-black uppercase tracking-widest border border-white/5 active:scale-95 text-xs sm:text-base"
          >
            <LogOut size={18} /> {t.signOut}
          </button>
          
          <div className="flex items-center justify-center gap-4 opacity-30">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em]">{t.version}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
