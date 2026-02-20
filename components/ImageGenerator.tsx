
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Wand2, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { ImageGeneration, SettingsState, User } from '../types';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/supabase';
import { TRANSLATIONS } from '../constants';
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
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">("1:1");

  const t = TRANSLATIONS[settings.language].images;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await geminiService.generateImage(prompt, aspectRatio, imageSize);
      const newImg: ImageGeneration = { id: Date.now().toString(), prompt: prompt.trim(), url: imageUrl, timestamp: Date.now() };
      
      // PERSIST TO SUPABASE WITH ACTUAL USER ID
      dbService.saveImage(user.id, prompt.trim(), imageUrl).catch(err => console.debug("Supabase media sync issue:", err));
      
      onSaveImage(newImg);
      setPrompt('');
    } catch (err: any) { setError(err.message || 'Failed to generate image.'); }
    finally { setIsGenerating(false); }
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

      <header className="relative z-10 sticky top-0 sm:top-4 p-4 sm:p-8 glass-panel border-white/10 rounded-none sm:rounded-[2.5rem] mx-0 sm:mx-6 mt-0 sm:mt-4 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 sm:p-5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-xl shadow-purple-500/10">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight"><span className="gradient-text">{t.title}</span></h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex gap-2 p-1 glass-panel rounded-2xl bg-white/5">
              {(["1:1", "3:4", "4:3", "9:16", "16:9"] as const).map((ratio) => (
                <button 
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${aspectRatio === ratio ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
            <div className="flex gap-2 p-1 glass-panel rounded-2xl bg-white/5">
              {(["1K", "2K", "4K"] as const).map((size) => (
                <button 
                  key={size}
                  onClick={() => setImageSize(size)} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${imageSize === size ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-[2rem] glass-panel border-white/10">
            <textarea 
              rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 bg-transparent border-none focus:ring-0 p-4 text-white font-medium resize-none text-base sm:text-lg min-h-[80px]"
            />
            <button 
              onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}
              className={`px-10 py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all active:scale-95 ${!prompt.trim() || isGenerating ? 'bg-slate-800 text-slate-600' : 'bg-purple-600 text-white shadow-2xl shadow-purple-600/20'}`}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {isGenerating ? t.generating : t.generate}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs font-bold mt-4 animate-pulse">{error}</p>}
        </div>
      </header>

      <div className="relative z-10 p-4 sm:p-10 max-w-7xl mx-auto w-full">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-700 opacity-30">
            <ImageIcon size={100} strokeWidth={1} className="mb-6" />
            <p className="text-2xl font-black mb-2 tracking-tight">{t.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {images.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-[2.5rem] overflow-hidden glass-panel border border-white/10 transition-all hover:scale-[1.03] shadow-xl">
                <img src={img.url} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-8 flex flex-col justify-end">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => window.open(img.url)} className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white"><Download /></button>
                    <button onClick={() => onDeleteImage(img.id)} className="p-4 rounded-2xl bg-red-500/20 hover:bg-red-500/40 text-red-400"><Trash2 /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
