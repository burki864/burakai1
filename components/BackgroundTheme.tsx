
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeType } from '../types';

interface BackgroundThemeProps {
  theme: ThemeType;
}

const MotionDiv = motion.div as any;

/**
 * WINTER SEASON
 * Soft drifting snow with depth-of-field blurs.
 */
const WinterEffect = () => {
  const flakes = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 8 + Math.random() * 8,
    delay: Math.random() * 10,
    opacity: 0.2 + Math.random() * 0.4
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-slate-900/10">
      {flakes.map(f => (
        <MotionDiv
          key={f.id}
          initial={{ top: '-10%', x: 0, opacity: 0 }}
          animate={{ 
            top: '110%', 
            x: [0, 40, -40, 0],
            opacity: [0, f.opacity, f.opacity, 0]
          }}
          transition={{ 
            duration: f.duration, 
            delay: f.delay, 
            repeat: Infinity, 
            ease: "linear",
            x: { duration: f.duration / 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bg-white/40 rounded-full blur-[0.5px]"
          style={{ width: f.size, height: f.size, left: `${f.left}%` }}
        />
      ))}
    </div>
  );
};

/**
 * RAIN SEASON
 * Persistent streaks with stochastic lightning flashes.
 */
const RainEffect = () => {
  const drops = useMemo(() => Array.from({ length: 80 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 0.4 + Math.random() * 0.2,
    opacity: 0.1 + Math.random() * 0.15
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-blue-900/10">
      {drops.map(d => (
        <div 
          key={d.id}
          className="absolute bg-blue-200 w-[1px] h-20 rounded-full"
          style={{ 
            left: `${d.left}%`, 
            top: '-20%', 
            opacity: d.opacity,
            transform: 'rotate(15deg)',
            animation: `rain-fall-local ${d.duration}s linear ${d.delay}s infinite` 
          }}
        />
      ))}
      <MotionDiv
        animate={{ opacity: [0, 0, 0.15, 0, 0.2, 0.05, 0.1, 0, 0] }}
        transition={{ duration: 15, repeat: Infinity, times: [0, 0.7, 0.71, 0.72, 0.73, 0.74, 0.75, 0.78, 1] }}
        className="absolute inset-0 bg-white mix-blend-overlay"
      />
      <style>{`@keyframes rain-fall-local { to { transform: translateY(120vh) rotate(15deg); } }`}</style>
    </div>
  );
};

/**
 * AUTUMN SEASON
 * Drifting leaves with warm orange tones and swaying wind paths.
 */
const AutumnEffect = () => {
  const leaves = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 6 + Math.random() * 12,
    duration: 10 + Math.random() * 10,
    delay: Math.random() * 15,
    color: ['#f97316', '#ea580c', '#c2410c', '#9a3412'][Math.floor(Math.random() * 4)],
    rotate: Math.random() * 360
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-orange-950/5">
      {leaves.map(l => (
        <MotionDiv
          key={l.id}
          initial={{ top: '-10%', x: 0, rotate: l.rotate, opacity: 0 }}
          animate={{ 
            top: '110%', 
            x: [0, 100, -100, 0],
            rotate: l.rotate + 720,
            opacity: [0, 0.6, 0.6, 0]
          }}
          transition={{ 
            duration: l.duration, 
            delay: l.delay, 
            repeat: Infinity, 
            ease: "linear",
            x: { duration: l.duration / 1.2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute rounded-sm blur-[1px]"
          style={{ width: l.size, height: l.size / 2, left: `${l.left}%`, backgroundColor: l.color }}
        />
      ))}
    </div>
  );
};

/**
 * SUNNY SEASON
 * Cinematic sunrays (god rays) and light dust motes.
 */
const SunnyEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none bg-orange-500/5">
    {/* Volumetric Sunray 1 */}
    <MotionDiv
      animate={{ opacity: [0.1, 0.2, 0.1], rotate: [-20, -15, -20] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-[20%] -left-[10%] w-[150%] h-[150%] bg-gradient-to-br from-yellow-200/20 via-transparent to-transparent blur-[100px] origin-top-left"
    />
    {/* Floating Motes */}
    {Array.from({ length: 30 }).map((_, i) => (
      <MotionDiv
        key={i}
        animate={{ y: [0, -100], x: [0, 20, -20, 0], opacity: [0, 0.3, 0] }}
        transition={{ duration: 5 + Math.random() * 5, delay: Math.random() * 5, repeat: Infinity }}
        className="absolute w-1 h-1 bg-yellow-100/40 rounded-full blur-[0.5px]"
        style={{ left: `${Math.random() * 100}%`, bottom: `${Math.random() * 100}%` }}
      />
    ))}
  </div>
);

/**
 * NEBULA THEME
 */
const SpaceEffect = () => {
  const stars = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i, size: Math.random() * 2, x: Math.random() * 100, y: Math.random() * 100,
    duration: 3 + Math.random() * 4, delay: Math.random() * 2, opacity: 0.3 + Math.random() * 0.4
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#020617]/40">
      <div className="absolute top-[10%] right-[10%] w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full" />
      <div className="absolute bottom-[10%] left-[10%] w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
      {stars.map(s => (
        <MotionDiv
          key={s.id}
          animate={{ opacity: [s.opacity * 0.5, s.opacity, s.opacity * 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity }}
          className="absolute bg-white rounded-full"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}
    </div>
  );
};

/**
 * CYBERPUNK THEME
 */
const NeonEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none bg-pink-950/5">
    <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />
    <MotionDiv
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      className="absolute top-[30%] h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
    />
  </div>
);

/**
 * SAHARA THEME
 */
const SaharaEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none bg-orange-900/10">
    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent" />
  </div>
);

const SEASONS = ['winter', 'rain', 'autumn', 'sunny'];

const BackgroundTheme: React.FC<BackgroundThemeProps> = ({ theme }) => {
  const [currentSeasonIndex, setCurrentSeasonIndex] = useState(0);

  // Four Seasons Loop Logic
  useEffect(() => {
    if (theme !== 'default') return;
    const interval = setInterval(() => {
      setCurrentSeasonIndex(prev => (prev + 1) % SEASONS.length);
    }, 12000); // 12 seconds per season
    return () => clearInterval(interval);
  }, [theme]);

  const renderEffect = (type: string) => {
    switch (type) {
      case 'winter':
      case 'snow': return <WinterEffect />;
      case 'rain': return <RainEffect />;
      case 'autumn': return <AutumnEffect />;
      case 'sunny': return <SunnyEffect />;
      case 'nebula': return <SpaceEffect />;
      case 'cyberpunk': return <NeonEffect />;
      case 'desert': return <SaharaEffect />;
      default: return null;
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      <AnimatePresence mode="wait">
        <MotionDiv
          key={theme === 'default' ? SEASONS[currentSeasonIndex] : theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5 }} // Smooth crossfade
          className="absolute inset-0"
        >
          {renderEffect(theme === 'default' ? SEASONS[currentSeasonIndex] : theme)}
        </MotionDiv>
      </AnimatePresence>
    </div>
  );
};

export default BackgroundTheme;
