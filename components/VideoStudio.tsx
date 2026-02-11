
import React, { useState } from 'react';
import { Video, Wand2, Loader2, Film, AlertCircle, Key } from 'lucide-react';
import { SettingsState } from '../types';
import GenerationAnimation from './GenerationAnimation';
import { TRANSLATIONS } from '../constants';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';

interface VideoStudioProps {
  settings: SettingsState;
  userPlan?: 'free' | 'pro';
}

const VideoStudio: React.FC<VideoStudioProps> = ({ settings, userPlan }) => {
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
    
    // Check if key selection is required (Mandatory for Veo)
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      try {
        await aistudio.openSelectKey();
      } catch (e) {
        setError("API Key selection is mandatory for Veo 3 Video Synthesis.");
        return;
      }
    }

    if (!checkRateLimit()) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatus("Waking up the neural engine...");

    try {
      storageService.setLastVideoTimestamp(Date.now());
      const url = await geminiService.generateVideo(prompt.trim(), aspectRatio, setStatus);
      setVideoUrl(url);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found") && aistudio) {
        setError("Project configuration error. Please re-select your paid API key.");
        await aistudio.openSelectKey();
      } else {
        setError(err.message || "Neural synthesis failed.");
      }
    } finally {
      setIsGenerating(false);
      setStatus("");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#030712] overflow-y-auto custom-scrollbar">
      <header className="p-4 md:p-8 glass-panel border-white/10 rounded-2xl md:rounded-[2.5rem] m-3 md:m-6 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 md:mb-10">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="p-3 md:p-5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                <Film size={24} className="md:w-8 md:h-8" />
              </div>
              <div>
                <h2 className="text-xl md:text-4xl font-black">{t.title}</h2>
                <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex gap-2 p-1.5 glass-panel rounded-xl md:rounded-2xl border-white/5 bg-white/5">
                <button 
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex-1 md:flex-none px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[10px] font-black transition-all ${aspectRatio === '16:9' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  LANDSCAPE 16:9
                </button>
                <button 
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex-1 md:flex-none px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[10px] font-black transition-all ${aspectRatio === '9:16' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  PORTRAIT 9:16
                </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
              <textarea 
                rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1 bg-white/5 rounded-2xl md:rounded-[2rem] border-white/10 p-4 md:p-5 text-white font-medium focus:ring-1 ring-blue-500 outline-none resize-none text-sm md:text-lg transition-all"
              />
              <button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}
                className="px-6 py-4 md:px-10 rounded-2xl md:rounded-[2rem] bg-blue-600 text-white font-black flex items-center justify-center gap-3 active:scale-95 hover:bg-blue-500 transition-all text-sm md:text-lg shadow-xl shadow-blue-600/20 disabled:opacity-50 min-w-[200px]">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                {isGenerating ? 'Synthesizing...' : t.generate}
              </button>
          </div>
          {error && <p className="mt-4 text-red-400 text-xs md:text-sm font-bold flex items-center gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-in fade-in slide-in-from-top-1"><AlertCircle size={14} />{error}</p>}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-20 relative min-h-[500px]">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-10 animate-in zoom-in duration-700">
            <GenerationAnimation type="video" />
            <div className="text-center space-y-4 max-w-sm">
              <p className="text-blue-400 font-black text-xs md:text-sm uppercase tracking-[0.4em] animate-pulse drop-shadow-sm">{status}</p>
              <div className="h-1.5 w-48 bg-white/5 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-blue-600 animate-loading-bar rounded-full"></div>
              </div>
              <p className="text-slate-500 text-[10px] font-bold leading-relaxed opacity-60">Synthesis takes 1-3 minutes. Maintaining temporal coherence requires deep neural processing.</p>
            </div>
          </div>
        ) : videoUrl ? (
          <div className="w-full max-w-5xl animate-in zoom-in duration-700 group relative">
             <div className="absolute -inset-10 bg-blue-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative z-10 p-1 glass-panel border-white/10 rounded-[3rem] shadow-3xl overflow-hidden ring-4 ring-blue-500/10">
                <video controls autoPlay loop className="w-full rounded-[2.8rem]">
                    <source src={videoUrl} type="video/mp4" />
                </video>
             </div>
             <div className="mt-10 flex justify-center">
               <button 
                 onClick={() => setVideoUrl(null)}
                 className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-slate-400 font-black text-[11px] tracking-widest hover:text-white hover:bg-white/10 transition-all uppercase"
               >
                 Initiate New Synthesis
               </button>
             </div>
          </div>
        ) : (
          <div className="text-slate-800 flex flex-col items-center gap-10 opacity-30 select-none">
            <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-blue-500/10 scale-150 rounded-full"></div>
                <Video size={140} strokeWidth={1} className="relative" />
            </div>
            <p className="font-black text-xl md:text-3xl uppercase tracking-[0.5em]">{t.empty}</p>
          </div>
        )}
      </div>

      <footer className="px-10 pb-12 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 glass-panel border-white/5 rounded-full">
            <Key size={14} className="text-blue-400" />
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-500 hover:text-blue-400 transition-colors tracking-widest uppercase">
              Veo 3 requires a Paid Project • View Billing Documentation
            </a>
        </div>
      </footer>

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
