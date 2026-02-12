
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-[25px] rounded-full scale-150 animate-pulse"></div>
      
      <svg 
        viewBox="0 0 100 100" 
        className="relative z-10 w-full h-full drop-shadow-[0_0_15px_var(--accent-glow)]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="b-symbol-grad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="60%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>
          
          <radialGradient id="nebula-grad" cx="50" cy="55" r="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
          </radialGradient>

          <filter id="glow-star">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* The Cosmic Ellipse Background */}
        <ellipse 
          cx="50" cy="55" rx="46" ry="22" 
          fill="url(#nebula-grad)" 
          transform="rotate(-12, 50, 55)"
        />
        
        {/* Orbital Ring Decoration */}
        <ellipse 
          cx="50" cy="55" rx="49" ry="24" 
          stroke="white" strokeWidth="0.4" strokeOpacity="0.25"
          transform="rotate(-12, 50, 55)"
          fill="none"
        />

        {/* Galaxy Star Particles */}
        <g transform="rotate(-12, 50, 55)">
          <circle cx="20" cy="52" r="0.4" fill="white" className="animate-pulse" />
          <circle cx="80" cy="58" r="0.4" fill="white" />
          <circle cx="45" cy="42" r="0.3" fill="white" style={{ animationDelay: '1.5s' }} className="animate-pulse" />
          <circle cx="65" cy="68" r="0.3" fill="white" />
          <circle cx="15" cy="62" r="2.5" fill="var(--accent-primary)" fillOpacity="0.4" />
          <circle cx="15" cy="62" r="1.5" fill="var(--accent-primary)" />
        </g>

        {/* Refined 'B' Path - Upper Segment */}
        <path 
          d="M38 22C42 22 75 18 80 38C85 58 55 58 48 58L40 58L38 22Z" 
          fill="url(#b-symbol-grad)"
        />
        
        {/* Refined 'B' Path - Lower Segment */}
        <path 
          d="M38 92C42 92 82 92 85 70C88 48 60 58 52 58L40 58L38 92Z" 
          fill="url(#b-symbol-grad)"
        />

        {/* The Central Split Line (matching background to create cut effect) */}
        <rect x="30" y="55" width="60" height="6" fill="#020617" />
        
        {/* Sharp Inner Detail (The swoosh tail/point) */}
        <path 
          d="M35 58C35 58 35 45 42 28" 
          stroke="url(#b-symbol-grad)" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <path 
          d="M35 58C35 58 35 75 42 88" 
          stroke="url(#b-symbol-grad)" 
          strokeWidth="3" 
          strokeLinecap="round"
        />

        {/* Central Star Flare (Core Sparkle) */}
        <g filter="url(#glow-star)">
          <circle cx="50" cy="52" r="3.5" fill="white" className="animate-pulse" />
          <path d="M42 52H58" stroke="white" strokeWidth="0.5" strokeLinecap="round" />
          <path d="M50 44V60" stroke="white" strokeWidth="0.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
