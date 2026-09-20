import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeType } from '../types';

interface BackgroundThemeProps {
  theme: ThemeType;
}

const MotionDiv = motion.div as any;

/**
 * 1. WINTER / SNOW EFFECT
 * Soft drifting snow with depth-of-field blurs and horizontal wind gusts.
 */
const WinterEffect = () => {
  const flakes = useMemo(() => Array.from({ length: 65 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 2.5 + Math.random() * 5,
    duration: 7 + Math.random() * 8,
    delay: Math.random() * 10,
    opacity: 0.25 + Math.random() * 0.5,
    sway: 30 + Math.random() * 40
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-sky-950/10">
      {flakes.map(f => (
        <MotionDiv
          key={f.id}
          initial={{ top: '-10%', x: 0, opacity: 0 }}
          animate={{ 
            top: '110%', 
            x: [0, f.sway, -f.sway, 0],
            opacity: [0, f.opacity, f.opacity, 0]
          }}
          transition={{ 
            duration: f.duration, 
            delay: f.delay, 
            repeat: Infinity, 
            ease: "linear",
            x: { duration: f.duration / 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bg-white/60 rounded-full blur-[0.6px] shadow-sm shadow-white/50"
          style={{ width: f.size, height: f.size, left: `${f.left}%` }}
        />
      ))}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-sky-500/5 to-transparent pointer-events-none" />
    </div>
  );
};

/**
 * 2. RAIN SEASON
 * Persistent streaks with stochastic lightning flashes.
 */
const RainEffect = () => {
  const drops = useMemo(() => Array.from({ length: 90 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 0.35 + Math.random() * 0.25,
    opacity: 0.15 + Math.random() * 0.25,
    height: 18 + Math.random() * 24
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-cyan-950/15">
      {drops.map(d => (
        <div 
          key={d.id}
          className="absolute bg-gradient-to-b from-transparent via-cyan-300 to-blue-400 w-[1.5px] rounded-full"
          style={{ 
            left: `${d.left}%`, 
            top: '-20%', 
            height: `${d.height}px`,
            opacity: d.opacity,
            transform: 'rotate(12deg)',
            animation: `rain-fall-local ${d.duration}s linear ${d.delay}s infinite` 
          }}
        />
      ))}
      {/* Occasional subtle lightning flash */}
      <MotionDiv
        animate={{ opacity: [0, 0, 0.12, 0, 0.18, 0.04, 0.08, 0, 0] }}
        transition={{ duration: 14, repeat: Infinity, times: [0, 0.68, 0.69, 0.70, 0.71, 0.72, 0.73, 0.75, 1] }}
        className="absolute inset-0 bg-blue-100 mix-blend-overlay"
      />
      <style>{`@keyframes rain-fall-local { to { transform: translateY(125vh) rotate(12deg); } }`}</style>
    </div>
  );
};

/**
 * 3. AUTUMN LEAVES EFFECT
 * Drifting leaves with warm amber, fiery orange and golden tones, rotating in 3D.
 */
const AutumnEffect = () => {
  const leaves = useMemo(() => Array.from({ length: 35 }).map((_, i) => {
    const colors = [
      'rgba(249, 115, 22, 0.75)', // orange
      'rgba(234, 88, 12, 0.75)',  // amber
      'rgba(194, 65, 12, 0.75)',  // rust
      'rgba(234, 179, 8, 0.75)',  // golden yellow
      'rgba(220, 38, 38, 0.7)'    // crimson
    ];
    return {
      id: i,
      left: Math.random() * 100,
      size: 8 + Math.random() * 14,
      duration: 8 + Math.random() * 9,
      delay: Math.random() * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      swayX: 50 + Math.random() * 70,
      rotateStart: Math.random() * 360
    };
  }), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-orange-950/10">
      {leaves.map(l => (
        <MotionDiv
          key={l.id}
          initial={{ top: '-10%', x: 0, rotate: l.rotateStart, opacity: 0 }}
          animate={{ 
            top: '110%', 
            x: [0, l.swayX, -l.swayX, 0],
            rotate: [l.rotateStart, l.rotateStart + 360, l.rotateStart + 720],
            opacity: [0, 0.75, 0.8, 0]
          }}
          transition={{ 
            duration: l.duration, 
            delay: l.delay, 
            repeat: Infinity, 
            ease: "linear",
            x: { duration: l.duration / 1.8, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: l.duration / 1.2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute"
          style={{ 
            width: l.size, 
            height: l.size * 0.7, 
            left: `${l.left}%`, 
            backgroundColor: l.color,
            borderRadius: '100% 0% 100% 10% / 100% 0% 100% 10%',
            boxShadow: `0 0 8px ${l.color}`
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-amber-600/5 pointer-events-none" />
    </div>
  );
};

/**
 * 4. FIREFLIES / ENCHANTED NIGHT EFFECT
 * Warm glowing bio-luminescent fireflies wandering and pulsing in the dark.
 */
const FirefliesEffect = () => {
  const fireflies = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 4,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 5,
    pulseSpeed: 2 + Math.random() * 3,
    color: Math.random() > 0.3 ? '#eab308' : '#10b981' // golden or emerald glow
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-emerald-950/15">
      {fireflies.map(f => (
        <MotionDiv
          key={f.id}
          animate={{
            x: [0, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, 0],
            y: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, 0],
            opacity: [0.1, 0.85, 0.2, 0.9, 0.15],
            scale: [0.8, 1.4, 0.9, 1.3, 0.8]
          }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: f.delay
          }}
          className="absolute rounded-full"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: f.size,
            height: f.size,
            backgroundColor: f.color,
            boxShadow: `0 0 12px 3px ${f.color}, 0 0 24px 6px ${f.color}66`
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/30 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

/**
 * 5. MATRIX DIGITAL CODE RAIN
 * High-performance canvas digital green code streams.
 */
const MatrixEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = "0123456789ABCDEF01010101XYZΩλπ#*<>{}";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array.from({ length: columns }).map(() => Math.floor(Math.random() * -100));

    let lastTime = 0;
    const fps = 30;
    const interval = 1000 / fps;

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);
      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      ctx.fillStyle = 'rgba(2, 8, 4, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#22c55e';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Bright tip
        ctx.fillStyle = '#bbf7d0';
        ctx.fillText(char, x, y);

        // Body
        ctx.fillStyle = '#22c55e';
        if (drops[i] > 1) {
          const prevChar = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(prevChar, x, y - fontSize);
        }

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-emerald-950/20">
      <canvas ref={canvasRef} className="w-full h-full opacity-40 mix-blend-screen" />
    </div>
  );
};

/**
 * 6. STARRY COSMOS & SHOOTING STARS (METEORS)
 */
const StarsEffect = () => {
  const stars = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2.5,
    duration: 2 + Math.random() * 4,
    delay: Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.7
  })), []);

  const meteors = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({
    id: i,
    startX: 10 + Math.random() * 70,
    startY: Math.random() * 30,
    delay: i * 4.5 + Math.random() * 2,
    duration: 1.8 + Math.random() * 1.2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-indigo-950/20">
      {stars.map(s => (
        <MotionDiv
          key={s.id}
          animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.3], scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}

      {meteors.map(m => (
        <MotionDiv
          key={m.id}
          initial={{ top: `${m.startY}%`, left: `${m.startX}%`, opacity: 0, scale: 0.5 }}
          animate={{
            top: `${m.startY + 45}%`,
            left: `${m.startX - 30}%`,
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 1, 0.2]
          }}
          transition={{
            duration: m.duration,
            delay: m.delay,
            repeat: Infinity,
            repeatDelay: 8 + Math.random() * 6,
            ease: "easeOut"
          }}
          className="absolute h-[2px] w-28 bg-gradient-to-r from-transparent via-cyan-300 to-white -rotate-45 origin-right rounded-full blur-[0.5px] shadow-[0_0_10px_#38bdf8]"
        />
      ))}
      <div className="absolute top-[15%] right-[15%] w-72 h-72 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
};

/**
 * 7. SAKURA BLOSSOMS (KİRAZ ÇİÇEĞİ BAHARI)
 * Gentle fluttering pink cherry blossom petals drifting with spring breezes.
 */
const SakuraEffect = () => {
  const petals = useMemo(() => Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 7 + Math.random() * 10,
    duration: 8 + Math.random() * 7,
    delay: Math.random() * 10,
    sway: 35 + Math.random() * 45,
    opacity: 0.4 + Math.random() * 0.45
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-pink-950/15">
      {petals.map(p => (
        <MotionDiv
          key={p.id}
          initial={{ top: '-10%', x: 0, rotate: 0, opacity: 0 }}
          animate={{
            top: '110%',
            x: [0, p.sway, -p.sway * 0.5, p.sway],
            rotate: [0, 180, 360],
            opacity: [0, p.opacity, p.opacity, 0]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            x: { duration: p.duration / 1.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: p.duration / 1.2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.8,
            backgroundColor: 'rgba(251, 113, 133, 0.75)',
            borderRadius: '60% 40% 70% 30% / 70% 30% 60% 40%',
            boxShadow: '0 0 8px rgba(244, 114, 182, 0.5)'
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 via-transparent to-rose-500/5 pointer-events-none" />
    </div>
  );
};

/**
 * 8. OCEAN / DEEP SEA BUBBLES & BIOLUMINESCENCE
 */
const OceanEffect = () => {
  const bubbles = useMemo(() => Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 4 + Math.random() * 14,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 8,
    sway: 15 + Math.random() * 25,
    opacity: 0.2 + Math.random() * 0.4
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-cyan-950/20">
      {bubbles.map(b => (
        <MotionDiv
          key={b.id}
          initial={{ bottom: '-10%', x: 0, opacity: 0 }}
          animate={{
            bottom: '110%',
            x: [0, b.sway, -b.sway, 0],
            opacity: [0, b.opacity, b.opacity, 0]
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "linear",
            x: { duration: b.duration / 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute rounded-full border border-cyan-300/40 bg-cyan-400/10 backdrop-blur-[0.5px] shadow-[0_0_8px_rgba(6,182,212,0.4)]"
          style={{ width: b.size, height: b.size, left: `${b.left}%` }}
        />
      ))}
      {/* Light ripples from surface */}
      <MotionDiv
        animate={{ opacity: [0.08, 0.18, 0.08], scale: [1, 1.05, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] inset-x-0 h-64 bg-gradient-to-b from-cyan-400/20 via-blue-500/10 to-transparent blur-[50px]"
      />
    </div>
  );
};

/**
 * 9. NEBULA THEME
 */
const SpaceEffect = () => {
  const stars = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i, size: Math.random() * 2, x: Math.random() * 100, y: Math.random() * 100,
    duration: 3 + Math.random() * 4, delay: Math.random() * 2, opacity: 0.3 + Math.random() * 0.4
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#020617]/40">
      <div className="absolute top-[10%] right-[10%] w-72 h-72 bg-purple-600/15 blur-[90px] rounded-full" />
      <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-blue-600/15 blur-[110px] rounded-full" />
      {stars.map(s => (
        <MotionDiv
          key={s.id}
          animate={{ opacity: [s.opacity * 0.5, s.opacity, s.opacity * 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity }}
          className="absolute bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.7)]"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}
    </div>
  );
};

/**
 * 10. CYBERPUNK THEME
 */
const NeonEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none bg-pink-950/10">
    <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(0,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.15)_1px,transparent_1px)] bg-[size:35px_35px]" />
    <MotionDiv
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      className="absolute top-[35%] h-[1.5px] w-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent shadow-[0_0_12px_#06b6d4]"
    />
    <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-pink-600/10 to-transparent pointer-events-none" />
  </div>
);

/**
 * 11. SAHARA THEME
 */
const SaharaEffect = () => {
  const motes = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 5 + Math.random() * 6,
    delay: Math.random() * 4
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-orange-950/15">
      <MotionDiv
        animate={{ opacity: [0.12, 0.22, 0.12], rotate: [-20, -15, -20] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -left-[10%] w-[150%] h-[150%] bg-gradient-to-br from-yellow-200/20 via-orange-400/10 to-transparent blur-[90px] origin-top-left"
      />
      {motes.map(m => (
        <MotionDiv
          key={m.id}
          animate={{ y: [0, -80], x: [0, 20, -20, 0], opacity: [0, 0.4, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity }}
          className="absolute w-1.5 h-1.5 bg-yellow-200/50 rounded-full blur-[0.5px] shadow-[0_0_6px_#fbbf24]"
          style={{ left: `${m.x}%`, bottom: `${m.y}%` }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent" />
    </div>
  );
};

const SEASONS = ['winter', 'rain', 'autumn', 'fireflies'];

const BackgroundTheme: React.FC<BackgroundThemeProps> = ({ theme }) => {
  const [currentSeasonIndex, setCurrentSeasonIndex] = useState(0);

  // Four Seasons Loop Logic for default
  useEffect(() => {
    if (theme !== 'default') return;
    const interval = setInterval(() => {
      setCurrentSeasonIndex(prev => (prev + 1) % SEASONS.length);
    }, 15000); // 15 seconds per season
    return () => clearInterval(interval);
  }, [theme]);

  const renderEffect = (type: string) => {
    switch (type) {
      case 'winter':
      case 'snow': return <WinterEffect />;
      case 'rain': return <RainEffect />;
      case 'autumn': return <AutumnEffect />;
      case 'fireflies': return <FirefliesEffect />;
      case 'matrix': return <MatrixEffect />;
      case 'stars': return <StarsEffect />;
      case 'sakura': return <SakuraEffect />;
      case 'ocean': return <OceanEffect />;
      case 'nebula': return <SpaceEffect />;
      case 'cyberpunk': return <NeonEffect />;
      case 'desert': return <SaharaEffect />;
      default: return null;
    }
  };

  const activeKey = theme === 'default' ? SEASONS[currentSeasonIndex] : theme;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <AnimatePresence mode="wait">
        <MotionDiv
          key={activeKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8 }}
          className="absolute inset-0"
        >
          {renderEffect(activeKey)}
        </MotionDiv>
      </AnimatePresence>
    </div>
  );
};

export default BackgroundTheme;
