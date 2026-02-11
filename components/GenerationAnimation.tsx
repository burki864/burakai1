
import React from 'react';

const GenerationAnimation: React.FC<{ type: 'image' | 'video' }> = ({ type }) => {
  return (
    <div className="relative w-full aspect-square max-w-[300px] md:max-w-[400px] rounded-3xl overflow-hidden glass-panel flex items-center justify-center border border-white/10 group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-fluid-morph opacity-50"></div>
      
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl border-2 border-white/20 animate-spin-slow flex items-center justify-center">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-full blur-xl animate-pulse"></div>
        </div>
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/50 animate-pulse">
            Neural {type} Synthesizing...
        </p>
      </div>

      <style>{`
        @keyframes fluid-morph {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1) rotate(0deg); filter: blur(20px); }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: scale(1.1) rotate(180deg); filter: blur(40px); }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1) rotate(360deg); filter: blur(20px); }
        }
        .animate-fluid-morph {
          animation: fluid-morph 8s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GenerationAnimation;
