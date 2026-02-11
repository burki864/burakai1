
import React from 'react';
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Globe, 
  Moon, 
  Sun, 
  Shield, 
  Bell, 
  LogOut, 
  Trash2,
  Cpu,
  Type as TypeIcon,
  Palette,
  CloudRain,
  Sun as SunIcon,
  Zap,
  Box,
  Sparkles
} from 'lucide-react';
import { SettingsState, User, Language, Personality, ThemeType } from '../types';
import { TRANSLATIONS } from '../constants';

interface SettingsProps {
  settings: SettingsState;
  onUpdateSettings: (settings: SettingsState) => void;
  user: User;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  user,
  onLogout
}) => {
  const t = TRANSLATIONS[settings.language].settings;

  const update = (key: keyof SettingsState, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const themes: { id: ThemeType; icon: React.ReactNode; label: string }[] = [
    { id: 'default', icon: <Box size={16} />, label: 'Standard' },
    { id: 'rain', icon: <CloudRain size={16} />, label: 'Rain Fall' },
    { id: 'desert', icon: <SunIcon size={16} />, label: 'Sahara' },
    { id: 'nebula', icon: <Sparkles size={16} />, label: 'Deep Space' },
    { id: 'cyberpunk', icon: <Zap size={16} />, label: 'Neon Grid' }
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-12 pb-24">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
              <UserIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{t.profile}</h2>
              <p className="text-slate-500 text-sm font-medium">{t.profileSub}</p>
            </div>
          </div>
          
          <div className="p-8 rounded-[2.5rem] glass-panel border-white/5 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-black shadow-2xl">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black">{user.name}</h3>
                <p className="text-slate-500 font-bold">{user.email}</p>
                <div className="mt-3 inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {user.plan.toUpperCase()} NODE
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{t.theme}</h2>
              <p className="text-slate-500 text-sm font-medium">{t.themeSub}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {themes.map((theme) => (
              <button 
                key={theme.id}
                onClick={() => update('activeTheme', theme.id)}
                className={`flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all ${settings.activeTheme === theme.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-xl' : 'glass-panel border-white/5 text-slate-500 hover:bg-white/5'}`}
              >
                <div className="p-3 rounded-2xl bg-white/5">{theme.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest">{theme.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
              <Cpu size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{t.aiEngine}</h2>
              <p className="text-slate-500 text-sm font-medium">{t.aiEngineSub}</p>
            </div>
          </div>
          
          <div className="p-8 rounded-[2.5rem] glass-panel border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <TypeIcon size={14} className="text-slate-500" /> Personality
                </label>
              </div>
              <select 
                value={settings.personality}
                onChange={(e) => update('personality', e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm font-black outline-none"
              >
                {Object.values(Personality).map(p => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-black text-xs uppercase tracking-widest">Entropy Level</label>
                <span className="text-xs font-mono text-purple-400 font-black">{settings.creativity}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" value={settings.creativity}
                onChange={(e) => update('creativity', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            <div className="space-y-3">
              <label className="font-black text-xs uppercase tracking-widest block">System Protocol</label>
              <textarea 
                value={settings.systemPrompt}
                onChange={(e) => update('systemPrompt', e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-purple-500 outline-none resize-none"
                placeholder="BurakAI core directives..."
              />
            </div>
          </div>
        </section>

        <section className="pt-8 space-y-4">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 p-6 rounded-3xl bg-slate-900 hover:bg-slate-800 transition-all text-white font-black uppercase tracking-widest border border-white/5"
          >
            <LogOut size={20} /> {t.signOut}
          </button>
        </section>
        
        <div className="text-center py-8">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">{t.version}</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
