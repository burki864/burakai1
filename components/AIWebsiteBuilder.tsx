import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, Monitor, Tablet, Smartphone, 
  ExternalLink, RefreshCw, Layout, Maximize2, AlertCircle 
} from 'lucide-react';

interface AIWebsiteBuilderProps {
  points: number;
  spendPoints: (amount: number) => boolean;
}

const AIWebsiteBuilder: React.FC<AIWebsiteBuilderProps> = ({ points, spendPoints }) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const builderUrl = "https://b-uilder.vercel.app/";

  // 📡 IFRAME'DEN GELEN MESAJLARI DİNLE
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Sadece kendi builder sitenden gelen veriyi kabul et
      if (event.origin !== "https://b-uilder.vercel.app") return;

      // Iframe içindeki site "ACTION_TRIGGERED" mesajı yollarsa puan düş
      if (event.data.type === 'GENERATE_SITE' || event.data.type === 'UPDATE_SITE') {
        if (points >= 10) {
          const success = spendPoints(10);
          if (success) {
            console.log("İşlem başarılı: 10 Coin düşüldü.");
            setError(null);
          }
        } else {
          setError("Yetersiz Coin! İşlem yapılamadı.");
          // Buraya istersen iframe'e "dur" mesajı da yollayabilirsin
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [points, spendPoints]);

  const reloadBuilder = () => {
    setIframeKey(prev => prev + 1);
    setError(null);
  };

  const containerWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '380px'
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Üst Bar */}
      <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-2xl flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
            <Layout className="text-emerald-400" size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tighter uppercase italic leading-none">BurakAI</h1>
            <span className="text-[8px] text-emerald-500 font-bold tracking-widest uppercase">Visual Engine v2</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold animate-bounce">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
            {(['desktop', 'tablet', 'mobile'] as const).map(m => (
              <button 
                key={m} 
                onClick={() => setPreviewMode(m)} 
                className={`p-2 rounded-lg transition-all ${previewMode === m ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {m === 'desktop' ? <Monitor size={16}/> : m === 'tablet' ? <Tablet size={16}/> : <Smartphone size={16}/>}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/10 mx-2" />

          <div className="flex items-center gap-2">
            <button 
              onClick={reloadBuilder}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
            >
              <RefreshCw size={18} />
            </button>
            <a 
              href={builderUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-emerald-500/20"
            >
              <ExternalLink size={14} /> DIŞARIDA AÇ
            </a>
          </div>
        </div>
      </header>

      {/* Iframe Alanı */}
      <main className="flex-1 bg-[#02040a] p-4 lg:p-8 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-full shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] rounded-[2rem] overflow-hidden border-[8px] border-slate-900 bg-slate-900"
          style={{ width: containerWidths[previewMode] }}
        >
          <iframe
            key={iframeKey}
            src={builderUrl}
            className="w-full h-full border-none bg-white"
            title="BurakAI Builder"
            allowFullScreen
          />
          
          <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center gap-4 bg-slate-900">
             <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AIWebsiteBuilder;