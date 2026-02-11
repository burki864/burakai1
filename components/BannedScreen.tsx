
import React from 'react';
import { ShieldAlert, Clock, Lock } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface BannedScreenProps {
  lang: Language;
  expiresAt?: number;
}

const BannedScreen: React.FC<BannedScreenProps> = ({ lang, expiresAt }) => {
  const t = TRANSLATIONS[lang].banned;
  
  const formatTime = (ms?: number) => {
    if (!ms) return t.permanent;
    const diff = ms - Date.now();
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
    const days = Math.floor(diff / 1000 / 60 / 60 / 24);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6 z-[999]">
      <div className="absolute inset-0 bg-red-900/10 blur-[150px]"></div>
      <div className="max-w-2xl w-full glass-panel border-red-500/20 p-12 rounded-[4rem] text-center space-y-8 relative">
        <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-red-500/20 animate-pulse">
          <ShieldAlert size={64} className="text-red-500" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-red-500">{t.title}</h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            {t.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4">
            <Lock className="text-slate-500" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{t.device}</p>
              <p className="font-mono text-xs text-slate-300">ID: B-PURGE-X99</p>
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center gap-4">
            <Clock className="text-red-400" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">{t.expires}</p>
              <p className="font-black text-white">{formatTime(expiresAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedScreen;
