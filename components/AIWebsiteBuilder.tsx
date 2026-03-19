import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Monitor, Tablet, Smartphone, Download, Sparkles, Loader2, Layout, Folder, FileJson, Rocket, Plus, AlertCircle, X } from 'lucide-react';

const AIWebsiteBuilder = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'files'>('preview');

  // 🏗️ ANA AKSİYON FONKSİYONU
  const handleAction = async (isUpdate: boolean) => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    console.log("İstek gönderiliyor...");

    try {
      const response = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          currentProject: isUpdate ? JSON.stringify(projectData) : null 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Sunucu hatası: ${response.status}`);
      }

      const data = await response.json();
      console.log("Gelen Veri:", data);

      // 🛠️ FORMAT DÖNÜŞTÜRÜCÜ (iframe için içeriği hazırla)
      if (data.project) {
        setProjectData(data.project);
      } else if (data.code) {
        // Eğer model 'code' anahtarıyla düz HTML gönderirse
        setProjectData({ "index.html": data.code });
      } else if (typeof data === 'object') {
        setProjectData(data);
      } else {
        throw new Error("Geçerli bir kod yapısı alınamadı.");
      }

      setActiveTab('preview');
      if (isUpdate) setPrompt(''); 
    } catch (err: any) {
      console.error("Hata Detayı:", err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 📦 ZIP İNDİRME
  const deployToVercel = async () => {
    if (!projectData) return;
    try {
      // @ts-ignore
      const { default: JSZip } = await import('https://esm.sh/jszip');
      const zip = new JSZip();

      const addToZip = (obj: any, folder: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            folder.file(key, obj[key]);
          } else {
            addToZip(obj[key], folder.folder(key));
          }
        }
      };

      addToZip(projectData, zip);
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `burakai-site-${Date.now()}.zip`;
      link.click();
    } catch (e) {
      setError("ZIP oluşturulamadı.");
    }
  };

  // 🖼️ IFRAME İÇİN HTML İÇERİĞİNİ BUL
  const getIframeContent = () => {
    if (!projectData) return "";
    // index.html varsa onu al, yoksa ilk bulduğun string'i bas
    return projectData["index.html"] || Object.values(projectData).find(v => typeof v === 'string') || "";
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="h-20 border-b border-white/5 bg-slate-900/40 backdrop-blur-2xl flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Globe className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">BurakAI</h1>
            <span className="text-[10px] text-emerald-500 font-bold tracking-[0.3em] uppercase">Visual Builder v2</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner">
            {(['desktop', 'tablet', 'mobile'] as const).map(m => (
              <button 
                key={m} 
                onClick={() => setPreviewMode(m)} 
                className={`p-2.5 rounded-lg transition-all ${previewMode === m ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {m === 'desktop' ? <Monitor size={18}/> : m === 'tablet' ? <Tablet size={18}/> : <Smartphone size={18}/>}
              </button>
            ))}
          </div>
          {projectData && (
            <button 
              onClick={deployToVercel} 
              className="bg-white text-black px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-400 transition-all active:scale-95"
            >
              <Download size={16} /> ZIP İNDİR
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sol Kontrol Paneli */}
        <div className="w-85 border-r border-white/5 p-6 space-y-6 bg-slate-950/40 relative z-20">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={12}/> Tasarım Yapay Zekası
            </label>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Modern, koyu temalı bir portfolyo sitesi yap..."
              className="w-full h-64 bg-black/60 border border-white/5 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none text-emerald-50 font-medium placeholder:text-slate-700 shadow-inner"
            />
          </div>
          
          <div className="space-y-3 pt-2">
            <button 
              onClick={() => handleAction(false)} 
              disabled={isGenerating} 
              className="w-full py-4 bg-slate-800 hover:bg-slate-750 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 border border-white/5 shadow-xl"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Rocket className="text-emerald-400" size={20} />} 
              SIFIRDAN OLUŞTUR
            </button>
            
            <button 
              onClick={() => handleAction(true)} 
              disabled={isGenerating || !projectData} 
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-10 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20}/>} 
              SİTEYİ GÜNCELLE
            </button>
          </div>
          
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold flex items-start gap-2 animate-pulse">
              <AlertCircle className="shrink-0" size={14}/> {error}
            </div>
          )}
        </div>

        {/* Sağ Önizleme Alanı */}
        <div className="flex-1 bg-[#02040a] p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="flex gap-10 mb-6 border-b border-white/5 relative z-10">
            <button 
              onClick={() => setActiveTab('preview')} 
              className={`pb-4 text-[11px] font-black tracking-widest transition-all ${activeTab === 'preview' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              CANLI ÖNİZLEME
            </button>
            <button 
              onClick={() => setActiveTab('files')} 
              className={`pb-4 text-[11px] font-black tracking-widest transition-all ${activeTab === 'files' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              KOD YAPISI
            </button>
          </div>

          <div className="flex-1 flex justify-center items-start overflow-hidden relative z-10">
            <AnimatePresence mode="wait">
              {activeTab === 'preview' ? (
                <motion.div 
                  key="preview" 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-[95%] bg-white rounded-[2.5rem] border-[12px] border-slate-950 shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-700 relative" 
                  style={{ width: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '380px' }}
                >
                  {projectData ? (
                    <iframe
                      id="preview-iframe"
                      title="Preview"
                      className="w-full h-full border-none bg-white"
                      srcDoc={getIframeContent()}
                    />
                  ) : (
                    <div className="h-full bg-slate-900 flex flex-col items-center justify-center text-slate-700 gap-6">
                      <div className="relative">
                        <Layout size={80} strokeWidth={1} className="animate-pulse" />
                        <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full" />
                      </div>
                      <p className="text-[10px] font-black tracking-[0.6em] uppercase opacity-50">BurakAI Bekleniyor</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="files" 
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="w-full h-full bg-black/60 rounded-3xl p-8 overflow-auto font-mono text-[13px] text-emerald-400/90 border border-white/5 custom-scrollbar shadow-2xl"
                >
                  {projectData ? (
                    <pre className="whitespace-pre-wrap leading-relaxed italic">
                      {JSON.stringify(projectData, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-slate-700 italic font-sans">// Dosya listesi henüz boş.</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIWebsiteBuilder;