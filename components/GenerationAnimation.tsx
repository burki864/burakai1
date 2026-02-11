
import React from 'react';

const GenerationAnimation: React.FC<{ type: 'image' | 'video' }> = ({ type }) => {
  return (
    <div className="relative w-full aspect-square max-w-[280px] md:max-w-[400px] rounded-[2rem] md:rounded-[3rem] overflow-hidden glass-panel flex items-center justify-center border border-white/10 group shadow-2xl">
      {/* Liquid Paint Mixing Layers */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/40 via-purple-600/40 to-pink-500/40 animate-fluid-morph blur-3xl opacity-60"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/30 via-cyan-400/30 to-blue-600/30 animate-fluid-morph-alt blur-2xl opacity-40"></div>
      
      {/* Rotating Core Square */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-20 h-20 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[2.5rem] border-[3px] border-white/30 animate-spin-slow flex items-center justify-center backdrop-blur-sm shadow-[0_0_50px_rgba(255,255,255,0.1)]">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-full blur-2xl animate-pulse opacity-80"></div>
            {/* Inner Rotating Element */}
            <div className="absolute inset-2 border border-white/10 rounded-2xl animate-spin-reverse"></div>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-white animate-pulse shadow-sm">
              Neural {type}
          </p>
          <div className="flex gap-1 justify-center">
            <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"></div>
            <div className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1 h-1 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fluid-morph {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1) translate(0, 0); }
          33% { border-radius: 40% 60% 50% 50% / 40% 70% 30% 60%; transform: scale(1.1) translate(10%, -5%); }
          66% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: scale(1.05) translate(-5%, 10%); }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1) translate(0, 0); }
        }
        @keyframes fluid-morph-alt {
          0% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: scale(1.1) rotate(0deg); }
          50% { border-radius: 70% 30% 40% 60% / 30% 70% 60% 40%; transform: scale(1) rotate(180deg); }
          100% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: scale(1.1) rotate(360deg); }
        }
        .animate-fluid-morph {
          animation: fluid-morph 10s ease-in-out infinite;
        }
        .animate-fluid-morph-alt {
          animation: fluid-morph-alt 12s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin 8s linear infinite reverse;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GenerationAnimation;
