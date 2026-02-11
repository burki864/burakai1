
import React from 'react';
import { ThemeType } from '../types';

interface BackgroundThemeProps {
  theme: ThemeType;
}

const BackgroundTheme: React.FC<BackgroundThemeProps> = ({ theme }) => {
  const themes: Record<ThemeType, React.ReactNode> = {
    default: null,
    rain: (
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent"></div>
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-blue-400 opacity-30 w-[1px] h-14 rounded-full animate-rain"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `-${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${0.4 + Math.random() * 0.4}s`
            }}
          />
        ))}
        {[...Array(15)].map((_, i) => (
          <div 
            key={`s-${i}`} 
            className="absolute bottom-0 bg-blue-300 opacity-20 w-1 h-1 rounded-full animate-splash"
            style={{ 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: '0.5s'
            }}
          />
        ))}
      </div>
    ),
    desert: (
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[#0c0502] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-950 opacity-40 via-transparent to-transparent"></div>
        {/* Simplified sand drift using a solid color grain effect instead of URL */}
        <div className="absolute inset-0 opacity-5 bg-white mix-blend-overlay"></div>
        <div className="absolute bottom-0 w-full opacity-10 blur-sm">
            <svg viewBox="0 0 1000 200" className="w-full h-auto fill-orange-700">
              <path d="M0,200 Q200,50 400,200 T800,200 L1000,200 L1000,200 L0,200 Z">
                <animate attributeName="d" dur="15s" repeatCount="indefinite" values="M0,200 Q200,50 400,200 T800,200 L1000,200 L1000,200 L0,200 Z; M0,200 Q300,80 600,200 T1000,200 L1000,200 L1000,200 L0,200 Z; M0,200 Q200,50 400,200 T800,200 L1000,200 L1000,200 L0,200 Z" />
              </path>
            </svg>
        </div>
        <div className="absolute top-10 right-10 w-40 h-40 bg-orange-500 opacity-5 rounded-full blur-[80px]"></div>
      </div>
    ),
    nebula: (
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[#02020a] overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-purple-900 opacity-10 rounded-full blur-[150px] animate-nebula-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-900 opacity-10 rounded-full blur-[150px] animate-nebula-pulse-delayed"></div>
        {[...Array(60)].map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-white rounded-full animate-twinkle"
            style={{ 
              width: `${Math.random() * 2}px`,
              height: `${Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random()
            }}
          />
        ))}
      </div>
    ),
    cyberpunk: (
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[#010105] overflow-hidden">
         {/* Simplified grid without complex perspective arbitrary values */}
         <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-transparent via-cyan-500 opacity-5 to-transparent h-px w-full top-1/2 animate-scan"></div>
         <div className="absolute top-0 left-1/4 w-[1px] h-full bg-pink-500 opacity-10 blur-sm"></div>
         <div className="absolute bottom-1/4 right-0 h-[1px] w-full bg-cyan-500 opacity-10 blur-sm"></div>
      </div>
    )
  };

  return (
    <>
      <style>{`
        @keyframes rain { to { transform: translateY(120vh); } }
        @keyframes splash { 0% { transform: scale(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(3); opacity: 0; } }
        @keyframes nebula-pulse { 0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.3; } 50% { transform: scale(1.1) translate(20px, 10px); opacity: 0.5; } }
        @keyframes nebula-pulse-delayed { 0%, 100% { transform: scale(1.1) translate(0, 0); opacity: 0.4; } 50% { transform: scale(1) translate(-20px, -10px); opacity: 0.2; } }
        @keyframes twinkle { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.2); opacity: 1; } }
        @keyframes scan { from { top: -10%; opacity: 0; } 50% { opacity: 0.5; } to { top: 110%; opacity: 0; } }
        
        .animate-rain { animation: rain linear infinite; }
        .animate-splash { animation: splash ease-out infinite; }
        .animate-nebula-pulse { animation: nebula-pulse 15s ease-in-out infinite; }
        .animate-nebula-pulse-delayed { animation: nebula-pulse-delayed 18s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle linear infinite; }
        .animate-scan { animation: scan 8s linear infinite; }
      `}</style>
      {themes[theme] || themes.default}
    </>
  );
};

export default BackgroundTheme;
