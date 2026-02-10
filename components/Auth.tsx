
import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Sparkles, CheckCircle2, ShieldCheck, Github, Chrome, ShieldAlert, Cpu, Loader2, Move, ExternalLink } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: User) => void;
}

const GOOGLE_CLIENT_ID = "34381438602-ae66ti1n83a95rqlffb2sve23ckf58rt.apps.googleusercontent.com";

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originError, setOriginError] = useState(false);
  const [lang, setLang] = useState<Language>(Language.EN);

  // Draggable logic states
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang].auth;

  useEffect(() => {
    // Detect system language
    if (navigator.language.startsWith('tr')) setLang(Language.TR);
    
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(interval);
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            use_fedcm_for_prompt: false, 
            cancel_on_tap_outside: true,
            itp_support: true,
          });
        } catch (e) {
          console.error("GSI Init Error:", e);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleCredentialResponse = (response: any) => {
    setLoading(true);
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);

      onLogin({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        provider: 'google',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Google Token Decode Error:", err);
      setError("Failed to verify identity node.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        onLogin({
          id: 'dev-operative',
          email,
          name: email.split('@')[0],
          provider: 'email',
          createdAt: new Date().toISOString()
        });
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const auth = (supabase as any).auth;
      const { data, error: supabaseError } = mode === 'login' 
        ? await auth.signInWithPassword({ email, password })
        : await auth.signUp({ email, password });

      if (supabaseError) {
        if (supabaseError.message === 'Invalid login credentials' && mode === 'login') {
          throw new Error('Account not found. Please click "Register Core" below to create your identity.');
        }
        throw supabaseError;
      }

      if (data.user) {
        onLogin({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          provider: 'email',
          createdAt: data.user.created_at
        });
      }
    } catch (err: any) {
      setError(err.message || "Auth Error.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setOriginError(false);
    if ((window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            console.warn("GSI Prompt Not Displayed:", reason);
            if (reason === 'opt_out_or_no_session' || reason === 'suppressed_by_user') {
               setError("Please ensure you are logged into a Google account in this browser.");
            } else {
               setOriginError(true);
               setError(`Identity link restricted for origin: ${window.location.origin}`);
            }
          }
        });
      } catch (e) {
        setError("Login node unreachable. Try traditional email access.");
      }
    } else {
      setError("Initializing Google Identity Node...");
    }
  };

  // Dragging Handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#010409] text-white overflow-y-auto custom-scrollbar relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[15%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse duration-[8s]"></div>
        <div className="absolute bottom-[20%] left-[15%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[130px] animate-pulse duration-[10s]"></div>
      </div>

      <div className="w-full lg:flex-1 min-h-[40vh] lg:min-h-screen flex relative items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-950/20 px-8 py-12 lg:p-0">
        <div className="max-w-2xl text-center z-10 lg:px-16">
          <Logo size={180} className="mb-12 mx-auto animate-float" />
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1] tracking-tighter">
            Neural<br/><span className="gradient-text">Core.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-bold leading-relaxed tracking-tight">
            Next-generation Gemini orchestration with industrial-grade persistence.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[650px] flex items-start justify-center p-6 md:p-12 relative z-10 lg:min-h-screen">
        <div 
          ref={cardRef}
          onMouseDown={onMouseDown}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          className={`w-full max-w-md glass-panel p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.6)] my-8 select-none transition-shadow duration-300 ${isDragging ? 'shadow-[0_40px_100px_rgba(0,0,0,0.8)] z-50' : ''}`}
        >
          <div className="flex justify-center mb-4 lg:hidden">
            <div className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-500">
               <Move size={16} />
            </div>
          </div>

          <div className="mb-10 md:mb-14 text-center">
            <div className="inline-flex items-center gap-4 mb-6 md:mb-8 pointer-events-none">
                <Logo size={48} />
                <span className="text-3xl font-black tracking-tighter">BurakAI</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter leading-tight pointer-events-none">{mode === 'login' ? t.login : t.signup}</h2>
            <div className="flex flex-col items-center gap-2 pointer-events-none">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-80 italic">{t.uplink}</p>
                {isSupabaseConfigured && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">Supabase Linked</span>
                  </div>
                )}
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6 md:space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-600 uppercase tracking-[0.3em] ml-4">{t.email}</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 md:py-6 pl-16 pr-8 outline-none focus:border-blue-500 focus:ring-8 ring-blue-500/5 transition-all font-black text-xl"
                  placeholder="name@matrix.io"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-600 uppercase tracking-[0.3em] ml-4">{t.password}</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 md:py-6 pl-16 pr-8 outline-none focus:border-blue-500 focus:ring-8 ring-blue-500/5 transition-all font-black text-xl"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 md:p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-xs font-black flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                  <ShieldAlert size={24} className="shrink-0" /> 
                  <span className="leading-relaxed">{error}</span>
                </div>
                {originError && (
                  <div className="mt-2 pt-3 border-t border-red-500/10 text-[10px] space-y-2 opacity-80">
                    <p>Origin mismatch detected. To fix this, add the following URL to your Google Cloud Console "Authorized JavaScript origins":</p>
                    <code className="block bg-black/40 p-2 rounded border border-white/5 font-mono select-all">{window.location.origin}</code>
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                    >
                      Open Google Cloud Console <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-5 md:py-6 rounded-[2rem] shadow-3xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-6 text-xl md:text-2xl"
            >
              {loading ? <Loader2 className="animate-spin" size={32} /> : mode === 'login' ? t.initiate : t.secure}
            </button>
          </form>

          <div className="my-8 md:my-12 flex items-center gap-8">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-slate-600 font-black">{t.multiNode}</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
            <button 
              onClick={handleGoogleLogin} 
              className="flex items-center justify-center gap-4 py-4 md:py-5 glass-panel rounded-2xl md:rounded-3xl hover:bg-white/10 transition-all active:scale-95 font-black text-xs uppercase tracking-[0.2em] border-white/5"
            >
              <Chrome size={22} className="text-blue-400" /> Google
            </button>
            <button className="flex items-center justify-center gap-4 py-4 md:py-5 glass-panel rounded-2xl md:rounded-3xl hover:bg-white/10 transition-all active:scale-95 font-black text-xs uppercase tracking-[0.2em] border-white/5">
              <Github size={22} /> GitHub
            </button>
          </div>

          <p className="text-center text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
            {mode === 'login' ? t.missing : t.found}
            <button 
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setOriginError(false); }}
              className="text-blue-500 hover:text-blue-400 ml-3 font-black underline decoration-blue-500/30 underline-offset-4"
            >
              {mode === 'login' ? t.join : t.access}
            </button>
          </p>
          
          <div className="mt-8 flex justify-center gap-6">
            <button onClick={() => setLang(Language.EN)} className={`text-[10px] font-black tracking-widest px-2 py-1 transition-colors ${lang === Language.EN ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>EN</button>
            <button onClick={() => setLang(Language.TR)} className={`text-[10px] font-black tracking-widest px-2 py-1 transition-colors ${lang === Language.TR ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>TR</button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default Auth;
