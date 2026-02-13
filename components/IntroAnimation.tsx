
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroAnimationProps {
  onComplete: () => void;
  userName: string;
}

const MotionDiv = motion.div as any;

// Phases of the cinematic journey
type IntroPhase = 'WARP' | 'ARRIVAL' | 'CORE' | 'TRANSITION';

/**
 * Atmospheric Planet Component
 * Fakes 3D volume using gradients, blurs, and optional orbital rings.
 */
const AtmosphericPlanet = ({ color, size, top, left, delay, duration, hasRing = false }: any) => (
  <MotionDiv
    initial={{ opacity: 0, scale: 0.8, x: -20, y: -20 }}
    animate={{ 
      opacity: 0.4, 
      scale: 1, 
      x: [0, 40, 0], 
      y: [0, -30, 0] 
    }}
    transition={{ 
      opacity: { duration: 2, delay },
      x: { duration: duration * 1.2, repeat: Infinity, ease: "easeInOut" },
      y: { duration: duration, repeat: Infinity, ease: "easeInOut" }
    }}
    className="absolute pointer-events-none"
    style={{ width: size, height: size, top, left }}
  >
    {/* Planet Body */}
    <div 
      className="absolute inset-0 rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color} 0%, transparent 70%)`,
        filter: 'blur(30px)',
        boxShadow: `inset -20px -20px 60px rgba(0,0,0,0.9), 0 0 100px ${color}44`
      }}
    />
    
    {/* Optional Planetary Ring */}
    {hasRing && (
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[20%] rounded-[100%] border-[2px] border-white/10"
        style={{ 
          transform: 'translate(-50%, -50%) rotate(-25deg)',
          boxShadow: `0 0 20px ${color}22`,
          filter: 'blur(2px)'
        }}
      />
    )}
  </MotionDiv>
);

/**
 * Neural Scout (Spaceship)
 * A high-speed light streak representing advanced AI scouts.
 */
const NeuralScout = ({ delay }: { delay: number }) => (
  <MotionDiv
    initial={{ x: '-100vw', y: '20vh', opacity: 0, scale: 0.5 }}
    animate={{ 
      x: '110vw', 
      y: '40vh', 
      opacity: [0, 1, 1, 0],
      scale: [0.5, 1, 1, 0.5]
    }}
    transition={{ 
      duration: 1.2, 
      delay, 
      ease: [0.45, 0, 0.55, 1] 
    }}
    className="absolute pointer-events-none flex items-center"
  >
    {/* Ship Head */}
    <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_#fff]" />
    {/* Engine Trail */}
    <div className="w-32 h-[1px] bg-gradient-to-l from-white via-blue-400 to-transparent opacity-50" />
    {/* Engine Glow */}
    <div className="absolute -left-4 w-8 h-8 bg-blue-500/30 rounded-full blur-lg" />
  </MotionDiv>
);

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete, userName }) => {
  const [phase, setPhase] = useState<IntroPhase>('WARP');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('ARRIVAL'), 2000),
      setTimeout(() => setPhase('CORE'), 4200),
      setTimeout(() => setPhase('TRANSITION'), 6800),
      setTimeout(() => onComplete(), 7500)
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Pre-calculate star trajectories for warp field
  const stars = useMemo(() => Array.from({ length: 180 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 70;
    return {
      id: i,
      x2: Math.cos(angle) * distance * 18,
      y2: Math.sin(angle) * distance * 18,
      duration: 0.3 + Math.random() * 0.7,
      delay: Math.random() * 2
    };
  }), []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#000105] flex items-center justify-center overflow-hidden pointer-events-none">
      
      {/* Layer 0: AI Breathing Background */}
      <MotionDiv
        animate={{ 
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-tr from-blue-950/30 via-transparent to-purple-950/30"
      />

      {/* Layer 1: Warp Stars */}
      <AnimatePresence>
        {(phase === 'WARP' || phase === 'ARRIVAL') && (
          <MotionDiv 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {stars.map((star) => (
              <MotionDiv
                key={star.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ 
                  x: star.x2, 
                  y: star.y2, 
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0] 
                }}
                transition={{ 
                  duration: phase === 'WARP' ? star.duration : star.duration * 4, 
                  delay: star.delay,
                  ease: "easeIn",
                  repeat: Infinity
                }}
                className="absolute left-1/2 top-1/2 w-[2px] h-[2px] bg-white rounded-full blur-[0.5px]"
              />
            ))}
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Layer 2: Atmospheric Planets & Spaceships */}
      <AnimatePresence>
        {(phase === 'ARRIVAL' || phase === 'CORE') && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Massive Gas Giant with Rings */}
            <AtmosphericPlanet color="#3b82f6" size="45vw" top="-5%" left="-15%" delay={0.5} duration={28} hasRing={true} />
            
            {/* Distant Purple Planet */}
            <AtmosphericPlanet color="#a855f7" size="25vw" top="55%" left="75%" delay={1.2} duration={35} />
            
            {/* Small Frozen Moon */}
            <AtmosphericPlanet color="#1e40af" size="12vw" top="15%" left="85%" delay={2.2} duration={22} />

            {/* AI Spaceship Scouts */}
            <NeuralScout delay={2.5} />
            <NeuralScout delay={3.8} />
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Layer 3: The Energy Core */}
      <AnimatePresence>
        {phase === 'CORE' && (
          <MotionDiv
            initial={{ scale: 0.5, opacity: 0, filter: 'blur(40px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 5, opacity: 0, filter: 'blur(120px)' }}
            transition={{ type: 'spring', damping: 20, stiffness: 50 }}
            className="relative flex items-center justify-center"
          >
            {/* Pulsing White Glow Core */}
            <MotionDiv
              animate={{ 
                scale: [1, 1.15, 0.95, 1.1, 1],
                opacity: [0.6, 1, 0.7, 1, 0.6]
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute w-72 h-72 bg-white rounded-full blur-[110px] mix-blend-screen"
            />
            
            {/* Core Neural Text Reveal */}
            <div className="relative z-10 text-center px-10">
              <MotionDiv
                initial={{ letterSpacing: '1.5em', filter: 'blur(15px)', opacity: 0 }}
                animate={{ letterSpacing: '0.3em', filter: 'blur(0px)', opacity: 1 }}
                transition={{ duration: 1.8, delay: 0.4, ease: "easeOut" }}
                className="text-5xl md:text-8xl font-black uppercase text-white tracking-widest leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.9)]"
              >
                Welcome<br/>
                <span className="gradient-text !from-white !to-blue-200">BurakAI</span>
              </MotionDiv>
              
              <MotionDiv
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.6, y: 0 }}
                transition={{ duration: 1.2, delay: 1.8 }}
                className="text-[10px] md:text-xs font-black uppercase tracking-[1em] text-blue-400 mt-10 animate-pulse"
              >
                Neural Synchronization Active
              </MotionDiv>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Layer 4: Transition Flash Overload */}
      <AnimatePresence>
        {phase === 'TRANSITION' && (
          <MotionDiv 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-white z-[100]"
            style={{ borderRadius: '50%' }}
            transition={{ duration: 1, ease: [0.7, 0, 0.84, 0] }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default IntroAnimation;
