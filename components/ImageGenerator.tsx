import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Wand2, Loader2, AlertCircle } from 'lucide-react';
import { ImageGeneration, SettingsState, User } from '../types';
import { TRANSLATIONS } from '../constants';
import GenerationAnimation from './GenerationAnimation';

declare const puter: any;

// --- YARDIMCI BİLEŞEN: PİKSEL PİKSEL NETLEŞME EFEKTİ ---
const ProgressiveImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-[1500ms] ease-out
          ${isLoaded ? 'scale-100 blur-0 opacity-100' : 'scale-125 blur-3xl opacity-0'}`} 
      />
    </div>
  );
};

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
    const englishPrompt = await translateToEnglish(prompt.trim());

    // 🚀 DALL-E 3 TARZI DETAYLI PROMPT YAPISI
    // Burada "UHD", "8k", "High Detail" gibi genel kelimeler yerine 
    // DALL-E'nin sevdiği açıklayıcı ve teknik yapıyı kuruyoruz.
    const dalleQualityPrompt = `
      A high-end professional photography of ${englishPrompt}. 
      The image should have a photorealistic style, 
      captured with a 85mm lens at f/1.8 for a shallow depth of field. 
      Incredibly detailed textures, natural skin pores, 
      vivid and realistic color grading, cinematic studio lighting, 
      volumetric fog, sharp focus on the subject. 
      Masterpiece quality, 8k resolution, ray-traced reflections, 
      global illumination, strictly no cartoon, no 3d render, no plastic skin.
    `.trim();

    // Puter AI'yı en yüksek sadakat modunda çağırıyoruz
    const imageResult = await puter.ai.txt2img(dalleQualityPrompt, {
      model: 'flux-dev', // Eğer hata verirse catch bloğu bunu düzeltecek
      increased_fidelity: true, // 👈 EN KRİTİK AYAR: Daha fazla işlem süresi, daha fazla kalite.
      aspect_ratio: "1:1"
    });

    onSaveImage({
      id: `img-${Date.now()}`,
      url: imageResult.src, 
      prompt: prompt.trim(),
      timestamp: Date.now()
    });

    setPrompt('');
  } catch (err) {
    // ... hata yönetimi ...
  } finally {
    setIsGenerating(false);
  }
};
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-y-auto custom-scrollbar relative h-full">
      
      {/* INPUT SECTION */}
      <header className="relative z-10 p-4 sm:p-8 m-0 sm:m-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-3 p-2 rounded-[2.5rem] bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl">
            <textarea 
              rows={2} 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder="Ne hayal ediyorsun? (Örn: Ormanda yürüyen gerçekçi bir adam)"
              className="flex-1 bg-transparent border-none focus:ring-0 p-5 text-emerald-50 font-medium resize-none text-lg outline-none placeholder:text-slate-500"
            />
            <button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              className={`px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all active:scale-95 
                ${!prompt.trim() || isGenerating ? 'bg-slate-800 text-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'}`}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {isGenerating ? "HAYAL EDİLİYOR..." : "HAYAL ET"}
            </button>
          </div>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
        </div>
      </header>

      {/* GALLERY SECTION */}
      <main className="relative z-10 flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <GenerationAnimation type="image" />
            <p className="text-emerald-500 font-black text-sm uppercase tracking-[0.4em] animate-pulse">Puter AI Doku İşliyor...</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {images.map((img) => (
              <motion.div 
                key={img.id} 
                layout 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl aspect-square"
              >
                {/* 🔥 PİKSEL PİKSEL NETLEŞEN GÖRSEL */}
                <ProgressiveImage src={img.url} alt={img.prompt} />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                    <p className="text-white text-[12px] font-bold leading-relaxed mb-4 line-clamp-3">"{img.prompt}"</p>
                    <button 
                        onClick={() => onDeleteImage(img.id)}
                        className="bg-red-500/80 hover:bg-red-600 text-white py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        SİL
                    </button>
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