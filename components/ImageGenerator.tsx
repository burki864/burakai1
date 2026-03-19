import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Wand2, Loader2, AlertCircle } from 'lucide-react';
import { ImageGeneration, SettingsState, User } from '../types';
import { TRANSLATIONS } from '../constants';
import GenerationAnimation from './GenerationAnimation';

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

  const t = TRANSLATIONS[settings.language].images;

  // 🌍 Ücretsiz Google Translate Çeviri
  const translateToEnglish = async (text: string) => {
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      return data[0][0][0];
    } catch (err) {
      console.error("Çeviri hatası:", err);
      return text;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Türkçe promptu İngilizce'ye çevir
      const englishPrompt = await translateToEnglish(prompt.trim());

      // 2. Backend'e (api/image.ts) isteği at
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: englishPrompt }),
      });

      let imageUrl = "";

      if (response.ok) {
        const data = await response.json();
        imageUrl = data.url;
      } else {
        // Backend çalışmazsa doğrudan Frontend üzerinden oluştur (Plan B)
        const seed = Math.floor(Math.random() * 2147483647);
        imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(englishPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
      }

      // 3. Görseli Ön Yükle (Preload)
      const img = new Image();
      img.src = imageUrl;
      
      img.onload = () => {
        onSaveImage({
          id: `img-${Date.now()}`,
          url: imageUrl, 
          prompt: prompt.trim(),
          timestamp: Date.now()
        });
        setPrompt('');
        setIsGenerating(false);
      };

      img.onerror = () => {
        setError("Görsel motoru şu an cevap vermiyor. Lütfen birazdan tekrar dene.");
        setIsGenerating(false);
      };

    } catch (err) {
      setError("Bağlantı hatası oluştu.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-y-auto custom-scrollbar relative h-full">
      
      <header className="relative z-10 p-4 sm:p-8 glass-panel border-white/10 rounded-none sm:rounded-[2.5rem] m-0 sm:m-6 shadow-2xl">
        <div className="max-w-5xl mx-auto">
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
               <p className="text-emerald-500 font-black text-sm uppercase tracking-[0.5em] animate-pulse italic">Tuval Hazırlanıyor</p>
               <span className="text-[10px] text-slate-600 font-bold uppercase text-white/40">Fırçalar ve boyalar ayarlanıyor...</span>
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
                    // Hata durumunda ana servis üzerinden çok basit bir görsel çek
                    target.src = `https://pollinations.ai/p/error_loading?width=512&height=512&model=turbo`;
                  }}
                />
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