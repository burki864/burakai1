
import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Move, Chrome, Github, ShieldAlert, Loader2, Info, Zap } from 'lucide-react';
import { isSupabaseConfigured, createProfile } from '../services/supabase';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: User) => void;
}

const GOOGLE_CLIENT_ID = "34381438602-ae66ti1n83a95rqlffb2sve23ckf58rt.apps.googleusercontent.com";

/**
 * Generates a valid UUID v4 for database compatibility.
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gsiEnabled, setGsiEnabled] = useState(true);
  const [lang, setLang] = useState<Language>(Language.EN);

  // Draggable logic states
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang].auth || {
    login: 'Access Core', uplink: 'Uplink', email: 'Identity', 
    initiate: 'Initiate Link', secure: 'Secure Link', multiNode: 'Multi-Node Access'
  };

  useEffect(() => {
    if (navigator.language.startsWith('tr')) setLang(Language.TR);
    
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(interval);
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn("GSI Init Suppressed (Origin Restriction):", e);
          setGsiEnabled(false);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.split('-').join('+').split('_').join('/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);

      const user: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        provider: 'google',
        createdAt: new Date().toISOString(),
        plan: 'free'
      };

      await createProfile(user);
      onLogin(user);
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError("Failed to verify identity node. Try manual access.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = username.trim();
    if (!cleanName) return;
    
    setLoading(true);
    setError(null);

    // Simulate neural uplink
    setTimeout(async () => {
      try {
        // ID must be a valid UUID for Supabase profiles table
        const user: User = {
          id: generateUUID(),
          email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@burakai.local`,
          name: cleanName,
          provider: 'email',
          createdAt: new Date().toISOString(),
          plan: 'free'
        };

        if (isSupabaseConfigured) {
          await createProfile(user);
        }
        
        onLogin(user);
      } catch (err: any) {
        console.error("Uplink Error details:", err);
        setError(err.message || "Uplink Error.");
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  const handleGoogleLogin = () => {
    if (!gsiEnabled) {
      setError("Google Login is unavailable for this domain origin. Please use identity handle.");
      return;
    }
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          setError("Google login prompt suppressed. Please use manual handle.");
        }
      });
    } else {
      setError("Waiting for Identity Node...");
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
    if (window.innerWidth < 1024) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - dragStart.x });
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const onMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div className="h-full w-full flex flex-col lg:flex-row bg-[#010409] text-white overflow-y-auto custom-scrollbar relative scroll-smooth">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[15%] w-[800px] h-[800px] bg-blue-600 opacity-10 rounded-full blur-[150px] animate-pulse duration-[8s]"></div>
        <div className="absolute bottom-[20%] left-[15%] w-[600px] h-[600px] bg-purple-500 opacity-10 rounded-full blur-[130px] animate-pulse duration-[10s]"></div>
      </div>

      <div className="w-full lg:flex-1 min-h-[40vh] lg:h-full flex relative items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-950/20 px-8 py-12 lg:p-0">
        <div className="max-w-2xl text-center z-10 lg:px-16">
          <Logo size={180} className="mb-12 mx-auto animate-float" />
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1] tracking-tighter">
            Neural<br/><span className="gradient-text">Uplink.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-bold leading-relaxed tracking-tight">
           Define your presence. Enter the stream.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[650px] flex items-center justify-center p-6 md:p-12 relative z-10 min-h-max lg:min-h-full">
        <div 
          ref={cardRef}
          onMouseDown={onMouseDown}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          className={`w-full max-w-md glass-panel p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.6)] my-8 transition-shadow duration-300 ${isDragging ? 'shadow-[0_40px_100px_rgba(0,0,0,0.8)] z-50' : ''}`}
        >
          <div className="flex justify-center mb-4 lg:hidden">
            <div className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-500"><Move size={16} /></div>
          </div>

          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-4 mb-6">
              <Logo size={48} />
              <span className="text-3xl font-black tracking-tighter text-white">BurakAI</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter text-white">{t.login}</h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-10">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-600 uppercase tracking-[0.3em] ml-6">Identity Handle</label>
              <div className="relative group">
                <UserIcon className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
                <input 
                  type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 pl-20 pr-8 outline-none focus:border-blue-500 transition-all font-black text-2xl text-white placeholder-slate-800"
                  placeholder="e.g. Neo"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-xs font-black flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert size={24} className="shrink-0" /><span>{error}</span>
              </div>
            )}

            <button 
              type="submit" disabled={loading || !username.trim()}
              className="w-full group relative overflow-hidden bg-white text-black font-black py-6 rounded-[2.5rem] shadow-3xl transition-all disabled:opacity-20 flex items-center justify-center gap-4 text-2xl active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              {loading ? <Loader2 className="animate-spin" size={32} /> : (
                <>
                  <span>{t.initiate}</span>
                  <Zap size={24} className="text-blue-600" />
                </>
              )}
            </button>
          </form>

          <div className="my-12 flex items-center gap-6">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-[10px] uppercase tracking-[0.5em] text-slate-600 font-black whitespace-nowrap">Neural Pass</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <button 
                onClick={handleGoogleLogin} 
                className={`flex items-center justify-center gap-4 py-5 glass-panel rounded-[2rem] transition-all font-black text-xs uppercase tracking-[0.2em] border-white/5 text-slate-300 ${!gsiEnabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 active:scale-[0.98]'}`}
            >
                <Chrome size={20} className="text-blue-400" /> Use Google Node
            </button>
          </div>

          {!gsiEnabled && (
              <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                  <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-black text-blue-400/60 uppercase leading-relaxed tracking-wider">Protocol: manual identity required for this secure origin.</p>
              </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `@keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(2deg); } } .animate-float { animation: float 6s ease-in-out infinite; }` }} />
    </div>
  );
};

export default Auth;
