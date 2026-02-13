
import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const MouseGlow: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { damping: 30, stiffness: 200 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{
        // Cast to any because framer-motion x/y properties are omitted from the standard CSSProperties type used in React
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
      } as any}
      className="fixed inset-0 w-[500px] h-[500px] bg-[var(--accent-primary)] opacity-[0.07] rounded-full blur-[120px] pointer-events-none z-[1] mix-blend-screen"
    />
  );
};

export default MouseGlow;
