
import React, { useState } from 'react';
import { Video, Wand2, Loader2, Film, AlertCircle } from 'lucide-react';
import { SettingsState } from '../types';
import GenerationAnimation from './GenerationAnimation';
import { TRANSLATIONS } from '../constants';
import { storageService } from '../services/storageService';

interface VideoStudioProps {
  settings: SettingsState;
  userPlan?: 'free' | 'pro';
}

const VideoStudio: React.FC<VideoStudioProps> = ({ settings, userPlan }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    try {
      storageService.setLastVideoTimestamp(Date.now());
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVideoUrl(data.videoUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#030712] overflow-y-auto custom-scrollbar">
      <header className="p-4 md:p-8 glass-panel border-white/10 rounded-2xl md:rounded-[2.5rem] m-3 md:m-6 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 md:gap-5 mb-6 md:mb-10">
            <div className="p-3 md:p-5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10">
              <Film size={24} className="md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-xl md:text-4xl font-black">{t.title}</h2>
              <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
              <textarea 
                rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1 bg-white/5 rounded-2xl md:rounded-[2rem] border-white/10 p-4 md:p-5 text-white font-medium focus:ring-1 ring-blue-500 outline-none resize-none text-sm md:text-lg transition-all"
              />
              <button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}
                className="px-6 py-4 md:px-10 rounded-2xl md:rounded-[2rem] bg-blue-600 text-white font-black flex items-center justify-center gap-3 active:scale-95 hover:bg-blue-500 transition-all text-sm md:text-lg shadow-xl shadow-blue-600/20 disabled:opacity-50">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                {t.generate}
              </button>
          </div>
          {error && <p className="mt-4 text-red-400 text-xs md:text-sm font-bold flex items-center gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-in fade-in slide-in-from-top-1"><AlertCircle size={14} />{error}</p>}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6 md:p-20">
        {isGenerating ? (
          <GenerationAnimation type="video" />
        ) : videoUrl ? (
          <div className="w-full max-w-4xl animate-in zoom-in duration-500">
             <video controls autoPlay loop className="w-full rounded-[2.5rem] border border-white/10 shadow-3xl ring-4 ring-blue-500/10">
                <source src={videoUrl} type="video/mp4" />
             </video>
          </div>
        ) : (
          <div className="text-slate-800 flex flex-col items-center gap-6 opacity-30 select-none">
            <Video size={120} strokeWidth={1} />
            <p className="font-black text-xl md:text-3xl uppercase tracking-[0.4em]">{t.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoStudio;
