import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Globe, 
  Moon, 
  Sun, 
  Shield, 
  LogOut, 
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
  Snowflake,
  Leaf,
  Flame,
  Terminal,
  Star,
  Flower2,
  Waves,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { SettingsState, User, Language, ThemeType } from '../types';
import { TRANSLATIONS } from '../constants';
import { updateProfile } from '../services/supabase';
import { aiService } from '../services/aiService';

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

  // Web Search Test State
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ summary: string; sources: { title: string; url: string }[] } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

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
      setError(err.message || 'Profil güncellenirken hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestSearch = async () => {
    if (!testSearchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const result = await aiService.webSearch(testSearchQuery.trim());
      setSearchResult(result);
    } catch (err: any) {
      setSearchError(err.message || 'Canlı arama gerçekleştirilemedi.');
    } finally {
      setIsSearching(false);
    }
  };

  const themes: { 
    id: ThemeType; 
    icon: React.ReactElement; 
    label: string; 
    description: string;
    colorClass: string; 
    activeColor: string;
    badge: string;
  }[] = [
    { 
      id: 'snow', 
      icon: <Snowflake />, 
      label: 'Kar Yağışı', 
      description: 'Süzülen kar taneleri ve kış esintisi', 
      colorClass: 'text-sky-300', 
      activeColor: 'bg-sky-500/20 border-sky-400 shadow-sky-500/30',
      badge: 'Kış'
    },
    { 
      id: 'rain', 
      icon: <CloudRain />, 
      label: 'Gece Yağmuru', 
      description: 'Dinamik yağmur çizgileri ve fırtına', 
      colorClass: 'text-cyan-400', 
      activeColor: 'bg-cyan-600/20 border-cyan-400 shadow-cyan-500/30',
      badge: 'Yağmur'
    },
    { 
      id: 'autumn', 
      icon: <Leaf />, 
      label: 'Sonbahar', 
      description: 'Dökülen hazan yaprakları ve rüzgar', 
      colorClass: 'text-orange-400', 
      activeColor: 'bg-orange-600/20 border-orange-500 shadow-orange-500/30',
      badge: 'Yapraklar'
    },
    { 
      id: 'fireflies', 
      icon: <Flame />, 
      label: 'Ateş Böcekleri', 
      description: 'Karanlıkta süzülen ışıltılı orman', 
      colorClass: 'text-emerald-400', 
      activeColor: 'bg-emerald-600/20 border-emerald-500 shadow-emerald-500/30',
      badge: 'Büyülü'
    },
    { 
      id: 'matrix', 
      icon: <Terminal />, 
      label: 'Matrix Kod', 
      description: 'Akan siber yeşil dijital kod yağmuru', 
      colorClass: 'text-green-400', 
      activeColor: 'bg-green-600/20 border-green-500 shadow-green-500/30',
      badge: 'Siber'
    },
    { 
      id: 'stars', 
      icon: <Star />, 
      label: 'Kozmik Gece', 
      description: 'Derin gökyüzü ve kayan meteor izleri', 
      colorClass: 'text-indigo-400', 
      activeColor: 'bg-indigo-600/20 border-indigo-500 shadow-indigo-500/30',
      badge: 'Meteor'
    },
    { 
      id: 'sakura', 
      icon: <Flower2 />, 
      label: 'Sakura Baharı', 
      description: 'Nazik uçuşan pembe kiraz çiçekleri', 
      colorClass: 'text-pink-400', 
      activeColor: 'bg-pink-600/20 border-pink-500 shadow-pink-500/30',
      badge: 'Çiçek'
    },
    { 
      id: 'ocean', 
      icon: <Waves />, 
      label: 'Derin Okyanus', 
      description: 'Yükselen hava kabarcıkları ve su altı', 
      colorClass: 'text-blue-400', 
      activeColor: 'bg-blue-600/20 border-blue-500 shadow-blue-500/30',
      badge: 'Deniz'
    },
    { 
      id: 'nebula', 
      icon: <Sparkles />, 
      label: 'Nebula Uzay', 
      description: 'Mor galaksi toz bulutları ve yıldızlar', 
      colorClass: 'text-purple-400', 
      activeColor: 'bg-purple-600/20 border-purple-500 shadow-purple-500/30',
      badge: 'Galaksi'
    },
    { 
      id: 'cyberpunk', 
      icon: <Zap />, 
      label: 'Siberpunk', 
      description: 'Neon ızgara ve ışık tarama çizgisi', 
      colorClass: 'text-cyan-300', 
      activeColor: 'bg-cyan-500/20 border-cyan-400 shadow-cyan-500/30',
      badge: 'Neon'
    },
    { 
      id: 'desert', 
      icon: <SunIcon />, 
      label: 'Sahara Güneşi', 
      description: 'Sıcak güneş ışınları ve altın tozlar', 
      colorClass: 'text-amber-400', 
      activeColor: 'bg-amber-600/20 border-amber-500 shadow-amber-500/30',
      badge: 'Güneş'
    },
    { 
      id: 'default', 
      icon: <Box />, 
      label: 'Dört Mevsim', 
      description: 'Mevsimler arasında otomatik akıcı geçiş', 
      colorClass: 'text-blue-400', 
      activeColor: 'bg-blue-600/20 border-blue-500 shadow-blue-500/30',
      badge: 'Dinamik'
    }
  ];

  const currentThemeObj = themes.find(t => t.id === settings.activeTheme) || themes[0];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent h-full">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-10 space-y-8 md:space-y-12 pb-24 md:pb-32">
        
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
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kullanıcı Kimliği</label>
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
                    {user.plan.toUpperCase()} PLAN
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
              {isUpdating ? 'Senkronize Ediliyor...' : success ? 'Bilgiler Kaydedildi' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </section>

        {/* Atmosphere / Dynamic Animated Themes Section */}
        <section className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-500/20 text-indigo-400">
                <Palette size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Atmosfer & Canlı Arka Plan Temaları</h2>
                <p className="text-slate-500 text-[9px] sm:text-sm font-bold uppercase tracking-widest">
                  Kar, Yağmur, Sonbahar Yaprakları, Ateş Böcekleri ve Özel Efektler
                </p>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl glass-panel border border-white/10 self-start sm:self-auto">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Aktif: {currentThemeObj.label}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {themes.map((theme) => {
              const isSelected = settings.activeTheme === theme.id;
              return (
                <button 
                  key={theme.id}
                  onClick={() => update('activeTheme', theme.id)}
                  className={`flex flex-col items-start p-4 md:p-5 rounded-2xl sm:rounded-[2rem] border transition-all relative overflow-hidden group text-left ${isSelected ? theme.activeColor + ' scale-[1.02] shadow-xl' : 'glass-panel border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white/5 transition-transform group-hover:scale-110 ${isSelected ? theme.colorClass : 'text-slate-400'}`}>
                      {React.cloneElement(theme.icon as React.ReactElement<any>, { size: 20 })}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                      {theme.badge}
                    </span>
                  </div>
                  
                  <span className="text-xs sm:text-sm font-black tracking-tight text-white mb-1">
                    {theme.label}
                  </span>
                  
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight">
                    {theme.description}
                  </span>

                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 accent-bg" style={{ backgroundColor: 'var(--accent-primary)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Web Search / Canlı İnternet Araması Section */}
        <section className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Globe size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Web'den Canlı Arama</h2>
                <p className="text-slate-500 text-[9px] sm:text-sm font-bold uppercase tracking-widest">
                  Google & Canlı Web Grounding Kaynakları
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${settings.searchEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-white/5'}`}>
                {settings.searchEnabled ? '● Canlı Arama Aktif' : '○ Devre Dışı'}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem] glass-panel border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div className="space-y-1">
                <p className="font-black text-sm sm:text-base text-white tracking-tight">
                  Canlı Web Grounding & İnternet Erişimi
                </p>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                  Açık olduğunda yapay zeka; güncel haberler, son dakika olayları, hava durumu, borsa ve web siteleri hakkındaki sorular için internette gerçek zamanlı araştırma yapar ve kaynak bağlantıları sunar.
                </p>
              </div>

              <button 
                onClick={() => update('searchEnabled', !settings.searchEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 ${settings.searchEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.searchEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Quick Web Search Tester */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Search size={14} className="text-emerald-400" /> Web Araması Testi (Hızlı Önizleme)
                </label>
                <span className="text-[9px] text-slate-500 font-bold">Canlı Veri Motoru</span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    value={testSearchQuery}
                    onChange={(e) => setTestSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleTestSearch(); }}
                    placeholder="Örn: Yapay zeka dünyasındaki son gelişmeler..."
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-3.5 text-sm font-medium focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 text-white"
                  />
                </div>
                <button
                  onClick={handleTestSearch}
                  disabled={isSearching || !testSearchQuery.trim()}
                  className="px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 disabled:opacity-40 transition-all shrink-0 active:scale-95"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  <span>{isSearching ? 'Aranıyor...' : 'Web\'de Ara'}</span>
                </button>
              </div>

              {searchError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  {searchError}
                </div>
              )}

              {searchResult && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-3 mt-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                      <CheckCircle size={14} /> Canlı Arama Özeti
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {searchResult.sources?.length || 0} Doğrulanmış Kaynak
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {searchResult.summary}
                  </p>

                  {searchResult.sources && searchResult.sources.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Referans Kaynaklar:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {searchResult.sources.map((s, idx) => (
                          <a 
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-300 text-slate-400 text-[10px] font-medium border border-white/5 transition-all truncate max-w-xs"
                          >
                            <ExternalLink size={10} />
                            <span className="truncate">{s.url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Global Protocol Toggles */}
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-purple-500/20 text-purple-400">
              <Shield size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Protokoller & Arayüz</h2>
              <p className="text-slate-500 text-[9px] sm:text-sm font-bold uppercase tracking-widest">Sistem ve Görünüm Tercihleri</p>
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
                  <p className="font-black text-xs sm:text-sm uppercase tracking-tight truncate">Gece Modu</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">Karanlık Arayüz Tasarımı</p>
                </div>
              </div>
              <button 
                onClick={() => update('darkMode', !settings.darkMode)}
                className={`w-12 h-6 sm:w-14 sm:h-8 rounded-full p-1 transition-colors shrink-0 ${settings.darkMode ? 'bg-[var(--accent-primary)]' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6 sm:translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Timestamps */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] glass-panel border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400 shrink-0">
                  <Globe size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs sm:text-sm uppercase tracking-tight truncate">Zaman Damgaları</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">Mesaj Gönderim Saatleri</p>
                </div>
              </div>
              <button 
                onClick={() => update('showTimestamps', !settings.showTimestamps)}
                className={`w-12 h-6 sm:w-14 sm:h-8 rounded-full p-1 transition-colors shrink-0 ${settings.showTimestamps ? 'bg-[var(--accent-primary)]' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white transition-transform ${settings.showTimestamps ? 'translate-x-6 sm:translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </section>

        {/* Language Selection */}
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-orange-500/20 text-orange-400">
              <Globe size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Arayüz Dili</h2>
              <p className="text-slate-500 text-[9px] sm:text-sm font-bold uppercase tracking-widest">Sistem Dil Tercihi</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
             <button 
               onClick={() => update('language', Language.TR)}
               className={`p-5 rounded-[2rem] glass-panel border transition-all font-black text-xs uppercase tracking-widest ${settings.language === Language.TR ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-xl' : 'border-white/5 text-slate-500'}`}
             >
               Türkçe
             </button>
             <button 
               onClick={() => update('language', Language.EN)}
               className={`p-5 rounded-[2rem] glass-panel border transition-all font-black text-xs uppercase tracking-widest ${settings.language === Language.EN ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-xl' : 'border-white/5 text-slate-500'}`}
             >
               English
             </button>
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
