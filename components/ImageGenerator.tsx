
import React, { useState } from 'react';
import { Download, Trash2, Wand2, Loader2, Sparkles, Image as ImageIcon, Camera } from 'lucide-react';
import { ImageGeneration, SettingsState } from '../types';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/supabase';
import { TRANSLATIONS } from '../constants';

interface ImageGeneratorProps {
  images: ImageGeneration[];
  onSaveImage: (img: ImageGeneration) => void;
  onDeleteImage: (id: string) => void;
  settings: SettingsState;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  images,
  onSaveImage,
  onDeleteImage,
  settings
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[settings.language].images;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const imageUrl = await geminiService.generateImage(prompt);
      const newImg: ImageGeneration = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        url: imageUrl,
        timestamp: Date.now()
      };
      
      dbService.saveImage('current-user', prompt, imageUrl).catch(() => {});
      
      onSaveImage(newImg);
      setPrompt('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (img: ImageGeneration) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `burakai-art-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#030712] overflow-y-auto custom-scrollbar">
      <header className="sticky top-4 z-20 p-8 glass-panel border-white/10 rounded-[2.5rem] mx-6 mt-4 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-5 mb-10">
            <div className="p-5 rounded-[2rem] bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Sparkles size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight">{t.title.split(' ')[0]} <span className="gradient-text">{t.title.split(' ')[1]}</span></h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t.subtitle}</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2.5rem] blur-2xl opacity-10 group-focus-within:opacity-20 transition-all"></div>
            <div className="relative flex gap-3 p-3 rounded-[2.5rem] glass-panel border-white/10 shadow-2xl">
              <textarea 
                rows={2} value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1 bg-transparent border-none focus:ring-0 p-5 text-white font-medium resize-none placeholder-slate-600 text-lg"
              />
              <button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`px-10 py-4 rounded-[2rem] font-black flex items-center gap-3 transition-all active:scale-95 text-lg ${!prompt.trim() || isGenerating ? 'bg-slate-800 text-slate-600' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/20'}`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Wand2 size={24} />}
                {isGenerating ? t.generating : t.generate}
              </button>
            </div>
          </div>
          {error && <p className="mt-4 text-red-400 text-sm font-bold flex items-center gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
        </div>
      </header>

      <div className="p-10 max-w-7xl mx-auto w-full">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-700">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-white/5 blur-[40px] rounded-full"></div>
                <ImageIcon size={120} strokeWidth={1} className="opacity-10 relative" />
            </div>
            <p className="text-2xl font-black mb-2 tracking-tight opacity-20">{t.empty}</p>
            <p className="text-sm font-bold uppercase tracking-widest opacity-20">{t.emptySub}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {images.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-[2.5rem] overflow-hidden glass-panel border border-white/10 transition-all hover:scale-[1.03] hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                <img src={img.url} alt={img.prompt} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-8 flex flex-col justify-end gap-6">
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                    <p className="text-sm text-white font-medium line-clamp-3 leading-relaxed">"{img.prompt}"</p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleDownload(img)}
                      className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 border border-white/10"
                    >
                      <Download size={20} />
                    </button>
                    <button 
                      onClick={() => onDeleteImage(img.id)}
                      className="p-4 rounded-2xl bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all active:scale-90 border border-red-500/20"
                    >
                      <Trash2 size={20} />
                    </button>
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
