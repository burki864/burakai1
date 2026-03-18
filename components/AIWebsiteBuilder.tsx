
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Code, 
  Play, 
  Download, 
  RefreshCw, 
  Layout, 
  Smartphone, 
  Monitor, 
  Tablet,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Zap,
  Plus
} from 'lucide-react';
import { SettingsState, User, AnalysisResult } from '../types';
import { TRANSLATIONS } from '../constants';

interface AIWebsiteBuilderProps {
  settings: SettingsState;
  user: User;
  analysisContext?: AnalysisResult[];
}

const AIWebsiteBuilder: React.FC<AIWebsiteBuilderProps> = ({ settings, user, analysisContext = [] }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  
  const [sections, setSections] = useState<{ id: string; code: string; type: string }[]>([]);
  const [isAddingSection, setIsAddingSection] = useState(false);
  
  const [designStyle, setDesignStyle] = useState<'modern' | 'minimal' | 'glass' | 'dark'>('modern');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [remoteTrigger, setRemoteTrigger] = useState<{ type: string; prompt: string } | null>(null);

  const generateFullHtml = (content: string) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BurakAI Generated Site</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
        <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Outfit:wght@300;400;600;900&display=swap');
          body { font-family: 'Outfit', 'Inter', sans-serif; overflow-x: hidden; }
          .glass { backdrop-filter: blur(16px); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); }
          [x-cloak] { display: none !important; }
        </style>
      </head>
      <body x-data="{ isMenuOpen: false, cartCount: 0 }" class="bg-[#030712] text-white">
        ${content}
        <script>
          AOS.init({ duration: 1000, once: true });
          lucide.createIcons();
        </script>
      </body>
      </html>
    `;
  };

  const handleAddSection = async (type: string = 'General') => {
    if (!prompt.trim() && !remoteTrigger?.prompt) return;
    if (isAddingSection) return;

    setIsAddingSection(true);
    setError(null);

    try {
      const p = remoteTrigger?.prompt || prompt.trim();
      const response = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, type, style: designStyle }),
      });

      if (!response.ok) throw new Error('Failed to generate section');

      const data = await response.json();
      const newSection = {
        id: Math.random().toString(36).substr(2, 9),
        code: data.code,
        type
      };
      
      const updatedSections = [...sections, newSection];
      setSections(updatedSections);
      
      // Update the full code preview
      const combinedHtml = updatedSections.map(s => s.code).join('\n');
      setGeneratedCode(generateFullHtml(combinedHtml));
      setPrompt(''); // Clear prompt after adding
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsAddingSection(false);
    }
  };

  useEffect(() => {
    const handleRemoteSection = (e: any) => {
      setRemoteTrigger(e.detail);
    };
    window.addEventListener('generate-website-section', handleRemoteSection);
    return () => window.removeEventListener('generate-website-section', handleRemoteSection);
  }, []);

  useEffect(() => {
    if (remoteTrigger) {
      handleAddSection(remoteTrigger.type);
      setRemoteTrigger(null);
    }
  }, [remoteTrigger]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedCode(null);
    setSections([]); // Reset sections when generating full site

    try {
      // Analiz bağlamını ve tasarım stilini prompt'a ekle
      let finalPrompt = prompt.trim();
      finalPrompt = `Style: ${designStyle.toUpperCase()}\n\n${finalPrompt}`;
      
      if (analysisContext.length > 0) {
        const latestAnalysis = analysisContext[0];
        finalPrompt = `Aşağıdaki analiz verilerini kullanarak bir web sitesi oluştur:\n\nAnaliz Verisi: ${JSON.stringify(latestAnalysis.data)}\n\nKullanıcı İsteği: ${finalPrompt}`;
      }

      const response = await fetch('/api/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, style: designStyle }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate website');
      }

      const data = await response.json();
      setGeneratedCode(generateFullHtml(data.code));
      setActiveTab('preview');
    } catch (err: any) {
      console.error('Website Generation Error:', err);
      setError(err.message || 'An error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCode = () => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      <header className="p-6 md:p-8 border-b border-white/5 glass-panel z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 shadow-xl shadow-emerald-600/10">
              <Globe size={28} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter">AI <span className="text-emerald-400">Web Builder</span></h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Tailwind Engine • Real-time Preview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
              <button 
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Monitor size={18} />
              </button>
              <button 
                onClick={() => setPreviewMode('tablet')}
                className={`p-2 rounded-lg transition-all ${previewMode === 'tablet' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Tablet size={18} />
              </button>
              <button 
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Smartphone size={18} />
              </button>
            </div>
            
            {generatedCode && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const blob = new Blob([generatedCode], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-widest transition-all"
                >
                  <ExternalLink size={16} />
                  Live View
                </button>
                <button 
                  onClick={downloadCode}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/20 text-xs font-black uppercase tracking-widest transition-all text-emerald-400"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Input Panel */}
        <div className="w-full md:w-80 lg:w-96 border-r border-white/5 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-900/50">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Design Style</label>
            <div className="grid grid-cols-2 gap-2">
              {(['modern', 'minimal', 'glass', 'dark'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setDesignStyle(style)}
                  className={`py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    designStyle === style 
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Describe your website</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A modern landing page for a coffee shop with a dark theme and vibrant orange accents..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none transition-all"
            />
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`col-span-2 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl ${!prompt.trim() || isGenerating ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-emerald-600/40 hover:bg-emerald-500 active:scale-95'}`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                {isGenerating ? 'Generating Full Site...' : 'Full Site Build'}
              </button>
              
              <div className="col-span-2 pt-4 border-t border-white/5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Add Section</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Hero', type: 'Hero' },
                    { label: 'Features', type: 'Features' },
                    { label: 'Pricing', type: 'Pricing' },
                    { label: 'Team', type: 'Team' },
                    { label: 'Contact', type: 'Contact' },
                    { label: 'Footer', type: 'Footer' }
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleAddSection(item.type)}
                      disabled={!prompt.trim() || isAddingSection}
                      className={`py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white flex items-center justify-center gap-2 ${isAddingSection ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isAddingSection ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-bold leading-relaxed">{error}</p>
            </div>
          )}

          {analysisContext.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} />
                  Active Context
                </h4>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {analysisContext[0].type}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {analysisContext[0].data.summary || analysisContext[0].data.video_summary || "Analiz verisi yüklendi."}
              </p>
            </div>
          )}

          <div className="space-y-4 pt-6 border-t border-white/5">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inspiration</h4>
            <div className="space-y-2">
              {[
                'SaaS Landing Page',
                'Personal Portfolio',
                'E-commerce Store',
                'Restaurant Menu',
                'Tech Blog'
              ].map((item) => (
                <button 
                  key={item}
                  onClick={() => setPrompt(prev => prev ? `${prev}, ${item}` : item)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-bold text-slate-400 transition-all text-left"
                >
                  {item}
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          {sections.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sections ({sections.length})</h4>
                <button 
                  onClick={() => {
                    setSections([]);
                    setGeneratedCode(null);
                  }}
                  className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div 
                    key={section.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-600">{index + 1}</span>
                      <span className="text-[11px] font-bold text-slate-300">{section.type}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newSections = sections.filter(s => s.id !== section.id);
                        setSections(newSections);
                        if (newSections.length > 0) {
                          setGeneratedCode(generateFullHtml(newSections.map(s => s.code).join('\n')));
                        } else {
                          setGeneratedCode(null);
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Plus size={14} className="rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col bg-slate-950 relative">
          <div className="flex border-b border-white/5 px-6">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'preview' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              Live Preview
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'code' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              Source Code
            </button>
          </div>

          <div className="flex-1 p-4 md:p-8 overflow-hidden flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeTab === 'preview' ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {generatedCode ? (
                    <div 
                      className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500"
                      style={{ width: previewWidths[previewMode], height: '100%' }}
                    >
                      <iframe 
                        ref={iframeRef}
                        srcDoc={generatedCode}
                        title="Website Preview"
                        className="w-full h-full border-none"
                        sandbox="allow-scripts"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                      <Layout size={120} strokeWidth={1} className="text-slate-800" />
                      <div className="space-y-2">
                        <p className="text-2xl font-black uppercase tracking-[0.4em] text-slate-800">Preview Ready</p>
                        <p className="text-xs font-bold uppercase tracking-widest">Generate a site to see it here</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="code"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="w-full h-full glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col"
                >
                  <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">index.html</span>
                  </div>
                  <pre className="flex-1 p-6 overflow-auto custom-scrollbar text-xs font-mono text-emerald-400/80 leading-relaxed">
                    {generatedCode || '// No code generated yet...'}
                  </pre>
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
