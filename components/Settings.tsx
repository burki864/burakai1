
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
  Type as TypeIcon
} from 'lucide-react';
import { SettingsState, User, Language, Personality } from '../types';
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

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
              <UserIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t.profile}</h2>
              <p className="text-slate-500 text-sm">{t.profileSub}</p>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl glass-panel space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-slate-400">{user.email}</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {user.provider === 'google' ? 'Google Account' : 'Email Account'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
              <Cpu size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t.aiEngine}</h2>
              <p className="text-slate-500 text-sm">{t.aiEngineSub}</p>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl glass-panel space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="font-medium flex items-center gap-2">
                  <TypeIcon size={16} className="text-slate-400" /> {t.personality}
                </label>
                <p className="text-xs text-slate-500">{t.personalitySub}</p>
              </div>
              <select 
                value={settings.personality}
                onChange={(e) => update('personality', e.target.value)}
                className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {Object.values(Personality).map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="font-medium">{t.creativity}</label>
                  <p className="text-xs text-slate-500">{t.creativitySub}</p>
                </div>
                <span className="text-xs font-mono text-purple-400">{settings.creativity}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={settings.creativity}
                onChange={(e) => update('creativity', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium block">{t.systemPrompt}</label>
              <textarea 
                value={settings.systemPrompt}
                onChange={(e) => update('systemPrompt', e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                placeholder="Custom system instructions..."
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-slate-500/20 text-slate-400">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t.preferences}</h2>
              <p className="text-slate-500 text-sm">{t.preferencesSub}</p>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl glass-panel space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                  <Globe size={18} />
                </div>
                <div>
                  <p className="font-medium">{t.language}</p>
                </div>
              </div>
              <select 
                value={settings.language}
                onChange={(e) => update('language', e.target.value)}
                className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value={Language.EN}>English (US)</option>
                <option value={Language.TR}>Türkçe</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                  <Moon size={18} />
                </div>
                <div>
                  <p className="font-medium">{t.appearance}</p>
                  <p className="text-xs text-slate-500">{t.appearanceSub}</p>
                </div>
              </div>
              <button 
                onClick={() => update('darkMode', !settings.darkMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="font-medium">{t.timestamps}</p>
                  <p className="text-xs text-slate-500">{t.timestampsSub}</p>
                </div>
              </div>
              <button 
                onClick={() => update('showTimestamps', !settings.showTimestamps)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.showTimestamps ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${settings.showTimestamps ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </section>

        <section className="pt-8 space-y-4">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-100 font-semibold"
          >
            <LogOut size={20} /> {t.signOut}
          </button>
          <button 
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-500/20 hover:bg-red-500/10 transition-colors text-red-500 font-semibold"
          >
            <Trash2 size={20} /> {t.deleteAcc}
          </button>
        </section>
        
        <div className="text-center py-8">
            <p className="text-xs text-slate-600">{t.version}</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
