
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video as VideoIcon, Wand2, Loader2, Sparkles, AlertCircle, Info, Key } from 'lucide-react';
import { SettingsState, User } from '../types';
import GenerationAnimation from './GenerationAnimation';
import { TRANSLATIONS } from '../constants';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import BackgroundTheme from './BackgroundTheme';

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
  const [isHovered, setIsHovered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const t = TRANSLATIONS[settings.language].video;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      try { await aistudio.openSelectKey(); } catch (e) { setError("API Key required."); return; }
    }
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatus("Initiating Veo Synthesis...");
    try {
      storageService.setLastVideoTimestamp(Date.now());
      const url = await geminiService.generateVideo(prompt.trim(), user.id, aspectRatio, setStatus);
      setVideoUrl(url);
    } catch (err: any) { setError(err.message || "Veo synthesis failed."); }
    finally { setIsGenerating(false); setStatus(""); }
  };

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 bg-transparent overflow-y-auto custom-scrollbar relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* LOCAL THEME OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <BackgroundTheme theme={settings.activeTheme} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <header className="relative z-10 p-4 sm:p-8 glass-panel border-white/10 rounded-none sm:rounded-[2.5rem] m-0 sm:m-6 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-xl shadow-indigo-600/10">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black leading-tight">Veo <span className="gradient-text">Cinematic</span></h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">High-Quality Neural Motion</p>
              </div>
            </div>
            <div className="flex gap-2 p-1 glass-panel rounded-2xl bg-white/5">
              <button onClick={() => setAspectRatio('16:9')} className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${aspectRatio === '16:9' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>16:9</button>
              <button onClick={() => setAspectRatio('9:16')} className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${aspectRatio === '9:16' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>9:16</button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <textarea 
              rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe vision..."
              className="flex-1 bg-white/5 rounded-[2rem] border-white/10 p-5 text-white font-medium focus:ring-1 ring-indigo-500 outline-none resize-none text-lg"
            />
            <button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}
              className="px-10 py-5 rounded-[2rem] bg-indigo-600 text-white font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-600/20">
              {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {isGenerating ? 'Synthesizing...' : 'Generate Veo'}
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 md:p-20 min-h-[400px]">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-10">
            <GenerationAnimation type="video" />
            <p className="text-indigo-400 font-black text-sm uppercase tracking-[0.4em] animate-pulse">{status}</p>
          </div>
        ) : videoUrl ? (
          <div className="w-full max-w-5xl group relative">
             <div className="relative z-10 p-1 glass-panel border-white/10 rounded-[3rem] shadow-3xl overflow-hidden ring-4 ring-indigo-500/10">
                <video controls autoPlay loop className="w-full rounded-[2.8rem]"><source src={videoUrl} type="video/mp4" /></video>
             </div>
          </div>
        ) : (
          <div className="text-slate-800 flex flex-col items-center gap-10 opacity-30 select-none">
            <VideoIcon size={120} strokeWidth={1} />
            <p className="font-black text-2xl uppercase tracking-[0.5em]">Empty Studio</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoStudio;
