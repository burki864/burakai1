import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trash2, Camera, Download, AlertCircle } from 'lucide-react';
import { ImageGeneration, SettingsState } from '../types';
import GenerationAnimation from './GenerationAnimation';

const ProgressiveImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900/50 flex items-center justify-center">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 text-emerald-500/20 animate-spin" />
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-2 text-slate-600 p-4 text-center">
          <AlertCircle size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Görsel Alınamadı</span>
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`w-full h-full object-cover transition-all duration-[1200ms] ease-out
          ${status === 'loaded' ? 'scale-100 blur-0 opacity-100' : 'scale-110 blur-2xl opacity-0'}`} 
      />
    </div>
  );
};

interface ImageGeneratorProps {
  images: ImageGeneration[];
  onSaveImage: (img: ImageGeneration) => void;
  onDeleteImage: (id: string) => void;
  settings: SettingsState;
  user: any;
  points: number;
  spendPoints: (amount: number) => boolean;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  images, onSaveImage, onDeleteImage, points, spendPoints 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateToEnglish = async (text: string) => {
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
      const data = await response.json();
      return data[0][0][0];
    } catch { return text; }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    
    if (points < 5) {
      setError("Yetersiz Puan! (Görsel üretimi için 5 Coin gerekir)");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const translated = await translateToEnglish(prompt.trim());
      const seed = Math.floor(Math.random() * 1000000);
      
      const finalUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(translated)}?seed=${seed}&width=1024&height=1024&nologo=true&enhance=true`;

      spendPoints(5);

      onSaveImage({
        id: `img-${Date.now()}`,
        url: finalUrl, 
        prompt: prompt.trim(),
        timestamp: Date.now()
      });

      setPrompt('');
      setTimeout(() => setIsGenerating(false), 1500);
    } catch (err) {
      setError("Sunucu şu an yanıt vermiyor, 10 saniye sonra tekrar dene.");
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, onSaveImage]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-y-auto custom-scrollbar relative h-full">
      <header className="relative z-20 p-4 sm:p-8 m-0 sm:m-6 sticky top-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-3 p-2 rounded-[2.5rem] bg-black/60 backdrop-blur-3xl border border-white/10 shadow-2xl focus-within:border-emerald-500/50 transition-all duration-300">
            <textarea 
              rows={2} 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder="BurakAI ile sorunsuz hayal et..."
              className="flex-1 bg-transparent border-none focus:ring-0 p-5 text-emerald-50 font-medium resize-none text-lg outline-none placeholder:text-slate-600"
            />
            <button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              className={`px-10 py-5 rounded-[2rem] font-black flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xl min-w-[160px]
                ${!prompt.trim() || isGenerating 
                  ? 'bg-slate-800 text-slate-600' 
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/40 hover:scale-[1.02]'}`}
            >
              <div className="flex items-center gap-2">
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                <span className="text-sm">{isGenerating ? "BAĞLANILIYOR..." : "HAYAL ET"}</span>
              </div>
              {!isGenerating && <span className="text-[9px] opacity-70 tracking-widest">-5 COIN</span>}
            </button>
          </div>
          {error && <p className="text-red-400 text-center mt-4 text-xs font-bold animate-pulse">{error}</p>}
        </div>
      </header>

      <main className="relative z-10 flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }} 
              className="flex flex-col items-center justify-center py-20 gap-6"
            >
              <GenerationAnimation type="image" />
              <div className="text-center">
                <p className="text-emerald-500 font-black text-sm uppercase tracking-[0.4em] animate-pulse">Yeni Hat Devrede</p>
                <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-2 block">Internal Error Koruması Aktif</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          <AnimatePresence mode="popLayout">
            {images.map((img) => (
              <motion.div 
                key={img.id} 
                layout 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl aspect-square"
              >
                <ProgressiveImage src={img.url} alt={img.prompt} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                  <p className="text-white text-[13px] font-medium leading-relaxed mb-6 line-clamp-3 italic">"{img.prompt}"</p>
                  <div className="flex gap-2">
                     <button onClick={() => onDeleteImage(img.id)} className="p-4 rounded-xl bg-red-500/20 hover:bg-red-500 transition-all">
                       <Trash2 size={16} className="text-red-100" />
                     </button>
                     <a href={img.url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-100 p-4 rounded-xl transition-all text-[10px] font-black uppercase">
                       <Download size={16} /> TAM EKRAN
                     </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ImageGenerator;