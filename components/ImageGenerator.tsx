import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Wand2, Loader2, Download, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import { ImageGeneration, SettingsState, User } from '../types';
import { TRANSLATIONS } from '../constants';
// aiService'i artık kullanmıyoruz çünkü direkt link oluşturacağız
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

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 🚀 BACKEND'SİZ DİREKT GÖRSEL ÇÖZÜMÜ
      const seed = Math.floor(Math.random() * 1000000);
      const cleanPrompt = prompt.trim().replace(/[\r\n]+/gm, " ");
      
      // En kaliteli Flux modelini kullanan direkt Pollinations linki
      // width/height 1024 yaparsak çok daha profesyonel durur
      const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
      
      const newImage: ImageGeneration = {
        id: `img-${Date.now()}-${seed}`,
        url: imageUrl,
        prompt: cleanPrompt,
        timestamp: Date.now()
      };

      // Yapay bir bekleme ekleyerek "üretiliyor" havası veriyoruz (Kullanıcı deneyimi için)
      await new Promise(resolve => setTimeout(resolve, 2000));

      onSaveImage(newImage);
      setPrompt('');
    } catch (err: any) {
      console.error("Üretim Hatası:", err);
      setError(err.message || "Görsel üretimi başarısız oldu.");
    } finally {
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
              <div className="p-4 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-xl shadow-purple-600/10">
                <ImageIcon size={32} />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tighter">
                  {t.title.split(' ')[0]} <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t.title.split(' ')[1]}</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{t.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 p-2 rounded-[2.5rem] glass-panel border-white/10 bg-black/20">
            <textarea 
              rows={2} 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder={t.placeholder}
              className="flex-1 bg-transparent border-none focus:ring-0 p-5 text-white font-medium resize-none text-lg md:text-xl outline-none"
            />
            <button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              className={`px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl ${!prompt.trim() || isGenerating ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-purple-600 text-white shadow-purple-600/40 hover:bg-purple-500'}`}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {isGenerating ? t.generating : t.generate}
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

      <main className="relative z-10 flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 gap-10">
            <GenerationAnimation type="image" />
            <p className="text-purple-400 font-black text-sm uppercase tracking-[0.4em] animate-pulse">{t.generating}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {images.map((img) => (
            <motion.div 
              key={img.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative glass-panel border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-square bg-slate-900"
            >
              <img 
                src={img.url} 
                alt={img.prompt} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.getAttribute('data-fallback-tried') === 'true') {
                    // Eğer yerleşik placeholder servisi de çökerse via.placeholder'a dön
                    target.src = "https://via.placeholder.com/1024?text=Gorsel+Yuklenemedi";
                    target.onerror = null; 
                    return;
                  }

                  target.setAttribute('data-fallback-tried', 'true');
                  const cleanPrompt = img.prompt.replace(/[\r\n]+/gm, " ").trim();
                  // Hata durumunda Pollinations'ın alternatif resim endpoint'ini dene
                  target.src = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}&nologo=true`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                <p className="text-white font-bold text-sm line-clamp-2 mb-6">{img.prompt}</p>
                <div className="flex gap-3">
                  <a 
                    href={img.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center gap-2 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Download size={14} />
                    {settings.language === 'tr' ? 'Görüntüle' : 'View'}
                  </a>
                  <button 
                    onClick={() => onDeleteImage(img.id)}
                    className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/20 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {images.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-32 opacity-20 select-none">
            <ImageIcon size={120} strokeWidth={1} className="text-slate-800" />
            <div className="text-center mt-8">
              <p className="font-black text-2xl uppercase tracking-[0.5em] text-slate-800">{t.empty}</p>
              <p className="text-xs font-bold uppercase tracking-widest mt-2">{t.emptySub}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ImageGenerator;