import React, { useState } from 'react';
import { Smartphone, Monitor, Apple, Download, ExternalLink, Sparkles, X, Share, PlusSquare, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSLATIONS } from '../constants';
import { SettingsState } from '../types';

interface DownloadsProps {
  settings: SettingsState;
}

const MotionDiv = motion.div as any;

const Downloads: React.FC<DownloadsProps> = ({ settings }) => {
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const t = TRANSLATIONS[settings.language].downloads;

  const handleDownloadAction = (id: string, link: string | null) => {
    if (id === 'apple') {
      setShowPwaGuide(true);
    } else if (link) {
      window.location.href = link;
    }
  };

  const downloadOptions = [
    {
      id: 'android',
      title: t.android,
      desc: t.apkDesc,
      icon: <Smartphone className="text-emerald-400" />,
      link: 'https://github.com/burki864/burakai1/releases/download/v2.1/BurakAI.apk',
      color: 'border-emerald-500/20 bg-emerald-500/5',
    },
    {
      id: 'windows',
      title: t.windows,
      desc: t.exeDesc,
      icon: <Monitor className="text-blue-400" />,
      link: 'https://github.com/burki864/burakai1/releases/download/v2.1/BurakAI_kur.exe',
      color: 'border-blue-500/20 bg-blue-500/5',
    },
    {
      id: 'apple',
      title: t.apple,
      desc: t.pwaDesc,
      icon: <Apple className="text-slate-200" />,
      link: null,
      color: 'border-slate-500/20 bg-white/5',
    }
  ];

  const pwaSteps = [
    {
      icon: <Share className="text-blue-400" />,
      text: settings.language === 'tr' ? "Safari tarayıcısında alt kısımdaki 'Paylaş' simgesine dokunun." : "Tap the 'Share' icon at the bottom of the Safari browser."
    },
    {
      icon: <ArrowUp className="text-purple-400" />,
      text: settings.language === 'tr' ? "Menüyü yukarı kaydırın ve 'Ana Ekrana Ekle' seçeneğini bulun." : "Scroll up and find the 'Add to Home Screen' option."
    },
    {
      icon: <PlusSquare className="text-emerald-400" />,
      text: settings.language === 'tr' ? "Sağ üst köşedeki 'Ekle' butonuna basarak kurulumu tamamlayın." : "Complete the setup by tapping the 'Add' button in the top right corner."
    }
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto custom-scrollbar bg-transparent h-full relative">
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-24 md:pb-32">
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 sm:p-4 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
              <Download size={24} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight"><span className="gradient-text">{t.title}</span></h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] sm:text-[11px]">{t.subtitle}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {downloadOptions.map((opt) => (
            <div key={opt.id} className={`p-8 rounded-[2.5rem] glass-panel border ${opt.color} flex flex-col items-center text-center space-y-6 transition-transform hover:scale-[1.02] shadow-2xl`}>
              <div className="p-6 rounded-[2rem] bg-black/40 shadow-inner">
                {React.cloneElement(opt.icon as React.ReactElement<any>, { size: 48 })}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">{opt.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-bold">{opt.desc}</p>
              </div>
              <button 
                onClick={() => handleDownloadAction(opt.id, opt.link)}
                className="w-full mt-auto py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5"
              >
                {opt.id === 'apple' ? <ExternalLink size={16} /> : <Download size={16} />}
                {opt.id === 'apple' ? (settings.language === 'tr' ? 'Adımları Gör' : 'See Steps') : t.downloadNow}
              </button>
            </div>
          ))}
        </div>

        <div className="p-8 sm:p-12 rounded-[3rem] glass-panel border border-blue-500/10 bg-blue-600/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 blur-[80px] rounded-full group-hover:bg-blue-600/30 transition-all"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="p-6 rounded-[2.5rem] bg-blue-600/20 text-blue-400 shadow-xl">
              <Sparkles size={48} />
            </div>
            <div className="space-y-4 text-center md:text-left">
              <h3 className="text-2xl font-black tracking-tight">Full Neural Synergy</h3>
              <p className="text-sm sm:text-lg text-slate-400 font-bold leading-relaxed max-w-2xl">
                Experience BurakAI across all your devices. Our native applications provide better performance, offline capabilities, and instant notifications.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPwaGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPwaGuide(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-8 md:p-12 rounded-[3.5rem] border border-white/10 shadow-3xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowPwaGuide(false)} className="p-3 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-8">
                <div className="p-5 rounded-3xl bg-blue-600/20 text-blue-400">
                  <Apple size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Apple PWA Installation</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">iOS Deployment Guide</p>
                </div>

                <div className="w-full space-y-6 text-left">
                  {pwaSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-5 items-start p-5 rounded-2xl bg-white/5 border border-white/5 group">
                      <div className="p-3 rounded-xl bg-slate-900 shadow-inner group-hover:scale-110 transition-transform">
                        {step.icon}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Step {idx + 1}</span>
                        <p className="text-sm font-bold text-slate-200 leading-relaxed">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowPwaGuide(false)}
                  className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-600/30 active:scale-95 transition-all"
                >
                  {settings.language === 'tr' ? 'Anladım' : 'Got it'}
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Downloads;