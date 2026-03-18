import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, Play, Pause, Download, RefreshCw, Volume2, VolumeX, 
  Loader2, AlertCircle, Sparkles, Disc, Clock, Trash2 
} from 'lucide-react';
import { SettingsState, User } from '../types';

interface MusicStudioProps {
  settings: SettingsState;
  user: User;
}

interface GeneratedTrack {
  id: string;
  prompt: string;
  url: string;
  timestamp: number;
  duration?: string;
}

const MusicStudio: React.FC<MusicStudioProps> = ({ settings, user }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setStatus('Neural Audio Synthesis Initiated...');

    try {
      // Doğrudan backend'e istek atıyoruz
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Sunucu hatası: ${response.status}`);
      }

      const data = await response.json();
      
      // Polling dosyan olmadığı için doğrudan 'url' bekliyoruz
      if (data.url) {
        const newTrack: GeneratedTrack = {
          id: data.requestId || `m-${Date.now()}`,
          prompt: prompt.trim(),
          url: data.url,
          timestamp: Date.now(),
          duration: data.duration || '0:30'
        };
        
        setTracks(prev => [newTrack, ...prev]);
        setPrompt('');
        setStatus('Synthesis Complete.');
      } else {
        throw new Error("API'den müzik adresi alınamadı.");
      }

    } catch (err: any) {
      console.error('Music Generation Error:', err);
      setError(err.message || 'Sentez sırasında bir hata oluştu.');
    } finally {
      setIsGenerating(false);
      // Status mesajını 3 saniye sonra temizle
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const togglePlay = (track: GeneratedTrack) => {
    if (!audioRef.current) return;

    if (playingId === track.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(() => setError("Oynatma başarısız: Tarayıcı engellemiş olabilir."));
      setPlayingId(track.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingId(null)} 
        muted={isMuted}
      />

      <header className="p-6 md:p-8 border-b border-white/5 glass-panel z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 shadow-xl shadow-cyan-600/10">
              <Music size={28} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">
                Music <span className="text-cyan-400">Studio</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Neural Audio Engine • {user.name}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-xl transition-all border ${isMuted ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Kontrol Paneli */}
        <div className="w-full md:w-80 lg:w-96 border-r border-white/5 p-6 space-y-6 overflow-y-auto bg-slate-900/30 custom-scrollbar">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sahneyi Sese Dönüştür</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örn: Dark techno beat with heavy bass..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-4 text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none transition-all placeholder:text-slate-600"
            />
            <button 
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`w-full py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl ${!prompt.trim() || isGenerating ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-cyan-600 text-white shadow-cyan-600/40 hover:bg-cyan-500 active:scale-95'}`}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {isGenerating ? 'Sentezleniyor...' : 'Müziği Üret'}
            </button>
          </div>

          <AnimatePresence>
            {status && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                <RefreshCw size={14} className="animate-spin" />
                {status}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          <div className="pt-6 border-t border-white/5 space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hızlı Türler</h4>
            <div className="grid grid-cols-2 gap-2">
              {['Phonk', 'Cyberpunk', 'Lo-Fi', 'Synthwave', 'Epic', 'Drill'].map(genre => (
                <button 
                  key={genre} 
                  onClick={() => setPrompt(genre)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-cyan-400 transition-all"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Parça Listesi */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-950 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence mode="popLayout">
              {tracks.map((track) => (
                <motion.div 
                  key={track.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group glass-panel rounded-[2rem] border border-white/5 p-4 flex items-center gap-5 hover:border-cyan-500/30 hover:bg-white/5 transition-all"
                >
                  <div className="relative w-16 h-16 rounded-2xl bg-cyan-600/10 flex items-center justify-center shrink-0 overflow-hidden border border-cyan-500/20 shadow-lg shadow-cyan-900/20">
                    <Disc size={30} className={`text-cyan-400 ${playingId === track.id ? 'animate-spin-slow' : ''}`} />
                    <button 
                      onClick={() => togglePlay(track)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {playingId === track.id ? <Pause size={24} className="text-white fill-white" /> : <Play size={24} className="text-white fill-white" />}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{track.prompt}</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(track.timestamp).toLocaleTimeString()}</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500/80 font-black">NEURAL HQ</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a href={track.url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-cyan-600 text-slate-400 hover:text-white transition-all shadow-lg">
                      <Download size={18} />
                    </a>
                    <button 
                      onClick={() => setTracks(prev => prev.filter(t => t.id !== track.id))} 
                      className="p-3 rounded-xl bg-white/5 hover:bg-red-500 text-slate-400 hover:text-white transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {tracks.length === 0 && !isGenerating && (
              <div className="flex flex-col items-center justify-center py-40 opacity-10 grayscale">
                <Music size={100} strokeWidth={1} />
                <p className="font-black text-xl uppercase tracking-[0.4em] mt-5">Studio Offline</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MusicStudio;