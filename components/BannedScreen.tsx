
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, Lock, Info, LogOut } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface BannedScreenProps {
  lang: Language;
  expiresAt?: number;
  reason?: string;
}

const BannedScreen: React.FC<BannedScreenProps> = ({ lang, expiresAt, reason }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const t = TRANSLATIONS[lang].banned;
  
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(t.permanent);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft("0d 0h 0m 0s");
        // Trigger a check or reload when time expires
        window.location.reload();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, t.permanent]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[999] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-red-900/5 blur-[120px] animate-pulse"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[150px]"></div>
      
      <div className="max-w-2xl w-full glass-panel border-red-500/20 p-8 md:p-14 rounded-[3.5rem] md:rounded-[5rem] text-center space-y-8 md:space-y-12 relative shadow-[0_0_80px_rgba(239,68,68,0.15)]">
        
        {/* Core Icon */}
        <div className="relative mx-auto">
          <div className="w-24 h-24 md:w-36 md:h-36 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-500/5 animate-pulse">
            <ShieldAlert size={64} className="text-red-500" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1 rounded-full shadow-lg">
            Restriction
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
            {t.title}
          </h1>
          <p className="text-base md:text-lg text-slate-500 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            Neural link severed due to protocol violation.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-white/5 border border-white/5 flex flex-col gap-3 group transition-all hover:bg-white/[0.08]">
            <div className="flex items-center gap-3 text-slate-500">
              <Lock size={18} />
              <p className="text-[10px] uppercase tracking-widest font-black">{t.device}</p>
            </div>
            <p className="font-mono text-sm text-slate-300 font-black">B-NODE-RESTR-01</p>
          </div>

          <div className="p-6 md:p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/10 flex flex-col gap-3 group transition-all hover:bg-red-500/[0.08]">
            <div className="flex items-center gap-3 text-red-400">
              <Clock size={18} />
              <p className="text-[10px] uppercase tracking-widest font-black">{t.expires}</p>
            </div>
            <p className="font-mono text-xl text-white font-black tracking-tight">{timeLeft}</p>
          </div>
        </div>

        {/* Reason Block */}
        {reason && (
          <div className="p-8 md:p-10 rounded-[2.5rem] bg-slate-900/50 border border-white/10 flex flex-col gap-4 text-left relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Info size={60} />
             </div>
             <div className="flex items-center gap-3 text-red-400">
              <Info size={18} />
              <p className="text-[10px] uppercase tracking-widest font-black">{t.reason}</p>
            </div>
            <p className="text-lg md:text-xl text-slate-200 font-bold leading-relaxed italic pr-12">
              "{reason}"
            </p>
          </div>
        )}

        {/* Sever Link Button */}
        <button 
          onClick={handleLogout}
          className="w-full py-6 rounded-3xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3 border border-white/5"
        >
          <LogOut size={16} /> Sever Current Link
        </button>
      </div>
    </div>
  );
};

export default BannedScreen;
