import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video as VideoIcon, Wand2, Loader2, Sparkles, AlertCircle, Download } from 'lucide-react';
import { SettingsState, User } from '../types';
import GenerationAnimation from './GenerationAnimation';
import { TRANSLATIONS } from '../constants';
// aiService ve storageService'i doğrudan URL kullandığımız için devre dışı bırakabiliriz veya importu tutabiliriz
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
    
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatus("Neural Motion Synthesis Initiated...");

    try {
      // 🚀 BACKEND'SİZ DİREKT VİDEO ÇÖZÜMÜ
      // video.pollinations.ai bazen DNS hatası verir, bu yüzden ana domaini kullanıyoruz.
      const seed = Math.floor(Math.random() * 1000000);
      const cleanPrompt = prompt.trim().replace(/[\r\n]+/gm, " ");
      
      // Pollinations Video API URL (Direct Link)
      // Not: Bu URL bir MP4 dosyası üretir. 
      const url = `https://pollinations.ai/p/${encodeURIComponent(cleanPrompt)}?model=video&seed=${seed}&width=${aspectRatio === '16:9' ? 1280 : 720}&height=${aspectRatio === '16:9' ? 720 : 1280}`;
      
      // Kullanıcıya üretim hissi vermek için kısa bir yapay bekleme
      await new Promise(resolve => setTimeout(resolve, 2000));

      setVideoUrl(url);
      setStatus("Synthesis Complete.");
      setIsGenerating(false);

    } catch (err: any) { 
      console.error("Video Hatası:", err);
      setError("Video sentezi sırasında bir sorun oluştu. Lütfen tekrar deneyin."); 
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 bg-transparent overflow-y-auto custom-scrollbar relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
                <VideoIcon size={32} />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tighter">
                  Studio <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Cinematic</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">AI Video Synthesis Engine</p>
              </div>
            </div>
            
            <div className="flex gap-2 p-1 glass-panel rounded-2xl bg-white/5 border border-white/5">
              {(['16:9', '9:16'] as const).map((ratio) => (
                <button 
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)} 
                  className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${aspectRatio === ratio ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 p-2 rounded-[2.5rem] glass-panel border-white/10 bg-black/20">
            <textarea 
              rows={2} 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Hayalindeki sahneyi betimle (İngilizce daha iyi sonuç verir)..."
              className="flex-1 bg-transparent border-none focus:ring-0 p-5 text-white font-medium resize-none text-lg md:text-xl outline-none"
            />
            <button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              className={`px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl ${!prompt.trim() || isGenerating ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-600/40 hover:bg-indigo-500'}`}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {isGenerating ? 'Sentezleniyor...' : 'Video Üret'}
            </button>
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 md:p-20 min-h-[400px]">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-10">
            <GenerationAnimation type="video" />
            <div className="text-center space-y-2">
              <p className="text-indigo-400 font-black text-sm uppercase tracking-[0.4em] animate-pulse">{status}</p>
              <p className="text-slate-500 text-[10px] font-bold">İlk üretim 10-20 saniye sürebilir, lütfen bekleyin...</p>
            </div>
          </div>
        ) : videoUrl ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl group relative"
          >
             <div className="relative z-10 p-1 glass-panel border-white/10 rounded-[3rem] shadow-3xl overflow-hidden ring-4 ring-indigo-500/10">
                <video 
                  controls 
                  autoPlay 
                  loop 
                  className={`w-full rounded-[2.8rem] shadow-inner ${aspectRatio === '9:16' ? 'max-h-[70vh] w-auto mx-auto' : ''}`}
                  src={videoUrl}
                  onError={() => setError("Video yüklenirken hata oluştu. API yoğun olabilir.")}
                >
                  Tarayıcınız video oynatmayı desteklemiyor.
                </video>
             </div>
             <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <a 
                  href={videoUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-full bg-black/50 backdrop-blur-xl text-white hover:bg-indigo-600 transition-colors block shadow-xl"
                >
                  <Download size={20} />
                </a>
             </div>
          </motion.div>
        ) : (
          <div className="text-slate-800 flex flex-col items-center gap-10 opacity-20 select-none">
            <VideoIcon size={120} strokeWidth={1} />
            <p className="font-black text-2xl uppercase tracking-[0.5em]">Stüdyo Hazır</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoStudio;