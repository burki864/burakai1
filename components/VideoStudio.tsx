
import React, { useState } from 'react';
import { Video, Wand2, Loader2, Film, AlertCircle, Sparkles, Info, RefreshCw } from 'lucide-react';
import { SettingsState, User } from '../types';
import GenerationAnimation from './GenerationAnimation';
import { TRANSLATIONS } from '../constants';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';

interface VideoStudioProps {
  settings: SettingsState;
  user: User;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ settings, user }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const t = TRANSLATIONS[settings.language].video;

  const checkRateLimit = (): boolean => {
    const lastTs = storageService.getLastVideoTimestamp();
    const now = Date.now();
    if (now - lastTs < 60000) {
      const remaining = Math.ceil((60000 - (now - lastTs)) / 1000);
      setError(`${t.rateLimit} (${remaining}s remaining)`);
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    if (!checkRateLimit()) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatus("Initiating Pika Link...");

    try {
      storageService.setLastVideoTimestamp(Date.now());
      const url = await geminiService.generateVideo(prompt.trim(), user.id, aspectRatio, setStatus);
      setVideoUrl(url);
    } catch (err: any) {
      setError(err.message || "Pika synthesis failed.");
    } finally {
      setIsGenerating(false);
      setStatus("");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#030712] overflow-y-auto custom-scrollbar">
      <header className="p-4 sm:p-6 md:p-8 glass-panel border-white/10 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] m-2 sm:m-4 md:m-6 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-10">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10 shrink-0">
                <Sparkles size={24} className="sm:w-8 sm:h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-4xl font-black leading-tight">{t.title}</h2>
                <p className="text-[7px] sm:text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-stretch md:items-end gap-2">
                <div className="flex gap-1.5 p-1.5 glass-panel rounded-xl md:rounded-2xl border-white/5 bg-white/5">
                    <button 
                    onClick={() => setAspectRatio('16:9')}
                    className={`flex-1 md:flex-none px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[9px] sm:text-[10px] font-black transition-all ${aspectRatio === '16:9' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                    CINEMATIC 16:9
                    </button>
                    <button 
                    onClick={() => setAspectRatio('9:16')}
                    className={`flex-1 md:flex-none px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[9px] sm:text-[10px] font-black transition-all ${aspectRatio === '9:16' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                    SOCIAL 9:16
                    </button>
                </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
              <textarea 
                rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1 bg-white/5 rounded-xl md:rounded-[2rem] border-white/10 p-4 md:p-5 text-white font-medium focus:ring-1 ring-indigo-500 outline-none resize-none text-sm sm:text-base md:text-lg transition-all min-h-[80px]"
              />
              <button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}
                className="w-full md:w-auto px-6 py-4 md:px-10 rounded-xl md:rounded-[2rem] bg-indigo-600 text-white font-black flex items-center justify-center gap-3 active:scale-95 hover:bg-indigo-500 transition-all text-sm sm:text-base md:text-lg shadow-xl shadow-indigo-600/20 disabled:opacity-50 md:min-w-[200px] shrink-0">
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                {isGenerating ? 'Synthesizing...' : t.generate}
              </button>
          </div>
          {error && (
            <div className="mt-4 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl flex items-center gap-2 text-red-400 text-[9px] sm:text-[10px] md:text-sm font-black uppercase">
                <AlertCircle size={16} className="shrink-0" />{error}
            </div>
          )}
          
          <div className="mt-4 sm:mt-6 flex items-start gap-3 text-slate-500 bg-white/5 p-3 sm:p-4 rounded-xl border border-white/5">
             <Info size={14} className="shrink-0 text-indigo-400 mt-0.5" />
             <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                Pika 1.0 creates cinematic motion sequences from neural descriptions. Synthesis typically takes 30-60 seconds.
             </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-20 relative min-h-[400px]">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-6 md:gap-10 animate-in zoom-in duration-700 w-full max-w-sm px-4">
            <GenerationAnimation type="video" />
            <div className="text-center space-y-3 md:space-y-4 w-full">
              <p className="text-indigo-400 font-black text-[10px] md:text-sm uppercase tracking-[0.4em] animate-pulse drop-shadow-sm">{status}</p>
              <div className="h-1 md:h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 animate-loading-bar rounded-full"></div>
              </div>
              <p className="text-slate-500 text-[8px] md:text-[10px] font-bold leading-relaxed opacity-60">Pika is calculating fluid dynamics and temporal consistency for your scene.</p>
            </div>
          </div>
        ) : videoUrl ? (
          <div className="w-full max-w-5xl animate-in zoom-in duration-700 group relative px-2">
             <div className="absolute -inset-10 bg-indigo-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"></div>
             <div className="relative z-10 p-1 glass-panel border-white/10 rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] shadow-3xl overflow-hidden ring-4 ring-indigo-500/10">
                <video controls autoPlay loop playsInline className="w-full rounded-2xl sm:rounded-[1.8rem] md:rounded-[2.8rem]">
                    <source src={videoUrl} type="video/mp4" />
                </video>
             </div>
             <div className="mt-6 sm:mt-10 flex justify-center">
               <button 
                 onClick={() => setVideoUrl(null)}
                 className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-white/5 border border-white/10 text-slate-400 font-black text-[9px] sm:text-[11px] tracking-widest hover:text-white hover:bg-white/10 transition-all uppercase"
               >
                 New Pika Generation
               </button>
             </div>
          </div>
        ) : (
          <div className="text-slate-800 flex flex-col items-center gap-6 sm:gap-10 opacity-30 select-none px-4">
            <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-indigo-500/10 scale-150 rounded-full"></div>
                <Video size={80} strokeWidth={1} className="sm:w-[140px] sm:h-[140px] relative" />
            </div>
            <p className="font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-[0.3em] sm:tracking-[0.5em] text-center">{t.empty}</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(20%); }
          100% { width: 30%; transform: translateX(330%); }
        }
        .animate-loading-bar {
          animation: loading-bar 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default VideoStudio;
