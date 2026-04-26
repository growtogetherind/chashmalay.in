import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import pic1 from '../../assets/hero/pic1.png';
import pic2 from '../../assets/hero/pic2.png';
import pic3 from '../../assets/hero/pic3.png';

const HeroSpotlightReveal = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeImage, setActiveImage] = useState(1); // Cycle through pic2 and pic3
  const containerRef = useRef(null);

  // Smooth mouse position values
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  // Extremely fluid flow springs
  const springConfig = { stiffness: 120, damping: 25, mass: 0.5 };
  const spotlightX = useSpring(mouseX, springConfig);
  const spotlightY = useSpring(mouseY, springConfig);
  
  // Spotlight size spring
  const radius = useSpring(0, { stiffness: 80, damping: 15 });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    radius.set(160);
    // Cycle image on every new hover for "flow" feel
    setActiveImage(prev => prev === 1 ? 2 : 1);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    radius.set(0);
  };

  const clipPath = useMotionTemplate`circle(${radius}px at ${spotlightX}% ${spotlightY}%)`;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Dashed Reveal Badge */}
      <motion.div 
        animate={{ opacity: isHovered ? 0.3 : 1 }}
        className="px-4 py-1 border border-dashed border-primary-blue/30 rounded-md"
      >
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary-blue/50">
          Hover to reveal
        </p>
      </motion.div>

      <div 
        ref={containerRef}
        className="relative w-full max-w-[500px] aspect-[4/5] rounded-[2.5rem] overflow-hidden cursor-none shadow-xl border-4 border-white"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Base Layer (pic1) */}
        <img 
          src={pic1} 
          alt="Base" 
          className="absolute inset-0 w-full h-full object-cover grayscale brightness-90 transition-all duration-700"
        />

        {/* Revealed Layer (Flowing between pic2 and pic3) */}
        <motion.div 
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ clipPath }}
        >
          <img 
            src={activeImage === 1 ? pic2 : pic3} 
            alt="Revealed" 
            className="w-full h-full object-cover scale-105"
          />
          {/* Internal shadow for depth */}
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.3)]" />
        </motion.div>

        {/* Trail / Liquid Glow following the mouse */}
        <motion.div 
          className="absolute pointer-events-none z-20 w-4 h-4 rounded-full bg-primary-blue/30 blur-xl"
          style={{
            top: useMotionTemplate`${spotlightY}%`,
            left: useMotionTemplate`${spotlightX}%`,
            translateX: "-50%",
            translateY: "-50%",
            scale: isHovered ? 15 : 0,
            opacity: isHovered ? 0.2 : 0
          }}
        />

        {/* Cursor spotlight ring */}
        <motion.div 
          className="absolute pointer-events-none z-30 border-2 border-white/80 rounded-full"
          style={{
            width: useMotionTemplate`${radius.get() * 2}px`,
            height: useMotionTemplate`${radius.get() * 2}px`,
            top: useMotionTemplate`${spotlightY}%`,
            left: useMotionTemplate`${spotlightX}%`,
            translateX: "-50%",
            translateY: "-50%",
            scale: useSpring(isHovered ? 1 : 0.8, { stiffness: 200, damping: 20 }),
            opacity: isHovered ? 1 : 0
          }}
        >
           {/* Crosshair inside spotlight for "flow" precision */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
              <div className="w-full h-[1px] bg-white/40" />
              <div className="absolute w-[1px] h-full bg-white/40" />
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSpotlightReveal;
