import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Wand2, Loader2, Trash2, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { ImageGeneration, SettingsState, User } from '../types';
import { TRANSLATIONS } from '../constants';
import GenerationAnimation from './GenerationAnimation';
import BackgroundTheme from './BackgroundTheme';

interface ImageGeneratorProps {
  images: ImageGeneration[];
  onSaveImage: (img: ImageGeneration) => void;
  onDeleteImage: (id: string) => void;
  settings: SettingsState;
  user: User;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  images, onSaveImage, onDeleteImage, settings, user 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const t = TRANSLATIONS[settings.language].images;

  const translateToEnglish = async (text: string) => {
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      return data[0][0][0];
    } catch (err) {
      return text;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Çeviri yap
      const englishPrompt = await translateToEnglish(prompt.trim());

      // 2. Kalite etiketlerini ekle
      const qualityTags = ", cinematic lighting, 8k resolution, highly detailed, masterpiece, sharp focus, professional photography";
      const finalPrompt = englishPrompt + qualityTags;

      // 3. URL oluştur
      const seed = Math.floor(Math.random() * 9999999);
      const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

      // 🔥 KRİTİK ADIM: ÖNYÜKLEME (PRELOAD)
      // Resim arka planda yüklenene kadar bekliyoruz ki galeride boş gözükmesin
      const img = new Image();
      img.src = imageUrl;
      
      img.onload = () => {
        const newImage: ImageGeneration = {
          id: `img-${Date.now()}`,
          url: imageUrl, 
          prompt: prompt.trim(),
          timestamp: Date.now()
        };
        onSaveImage(newImage);
        setPrompt('');
        setIsGenerating(false);
      };

      img.onerror = () => {
        throw new Error("Görsel yüklenemedi.");
      };

    } catch (err: any) {
      setError("Görsel motoru şu an meşgul. Lütfen tekrar dene.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-y-auto custom-scrollbar relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        <AnimatePresence>
          {isHovered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
              <BackgroundTheme theme={settings.activeTheme} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <header className="relative z-10 p-4 sm:p-8 glass-panel border-white/10 rounded-none sm:rounded-[2.5rem] m-0 sm:m-6 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-5 mb-8">
            <div className="p-4 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Sparkles size={32} />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none text-white">
                BURAKAI <span className="text-emerald-500 not-italic">STUDIO</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2 text-white/50">v2.0 Visual Engine (No-Limit)</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 p-2 rounded-[2.5rem] glass-panel border-white/10 bg-black/40 backdrop-blur-xl border">
            <textarea 
              rows={2} 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder={t.placeholder}
              className="flex-1 bg-transparent border-none focus:ring-0 p-5 text-emerald-50 font-medium resize-none text-lg outline-none placeholder:text-slate-600"
            />
            <button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              className={`px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all active:scale-95 ${!prompt.trim() || isGenerating ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30'}`}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {isGenerating ? "HAYAL EDİLİYOR..." : "HAYAL ET"}
            </button>
          </div>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 gap-10">
            <GenerationAnimation type="image" />
            <div className="flex flex-col items-center gap-2">
               <p className="text-emerald-500 font-black text-sm uppercase tracking-[0.5em] animate-pulse italic text-white">Tuval Hazırlanıyor</p>
               <span className="text-[10px] text-slate-600 font-bold uppercase text-white/40">Yapay zeka fırçası hareket ediyor...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {images.map((img) => (
              <motion.div 
                key={img.id} 
                layout 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative glass-panel border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-square bg-slate-900 border"
              >
               <img 
  src={img.url} 
  alt={img.prompt} 
  loading="lazy"
  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
  onError={(e) => {
    const target = e.currentTarget;
    // via.placeholder yerine Pollinations'ın kendisine çok basit bir istek atıyoruz
    // Bu sayede DNS hatası alma ihtimalini düşürüyoruz
    target.src = `https://pollinations.ai/p/error_loading_image?width=512&height=512&seed=42&model=turbo`;
    
    // Eğer o da olmazsa (opsiyonel), tarayıcının kendi içindeki bir boş görseli basarız:
    // target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  }}
/>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                  <p className="text-white text-[12px] font-medium line-clamp-3 mb-6 italic opacity-80 leading-relaxed">"{img.prompt}"</p>
                  <div className="flex gap-3">
                    <a href={img.url} target="_blank" rel="noopener noreferrer" 
                      className="flex-1 py-4 rounded-2xl bg-white text-black flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl">
                      <Eye size={16} /> İNCELE
                    </a>
                    <button 
                      onClick={() => onDeleteImage(img.id)}
                      className="p-4 rounded-2xl bg-red-600/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all active:scale-95 shadow-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {images.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-32 opacity-10 text-white">
            <ImageIcon size={100} strokeWidth={1} />
            <p className="mt-4 font-black uppercase tracking-[0.5em] text-sm">Stüdyo Boş</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ImageGenerator;