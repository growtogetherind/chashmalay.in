import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import pic1 from '../../assets/hero/pic1.png';
import pic2 from '../../assets/hero/pic2.png';
import pic3 from '../../assets/hero/pic3.png';

const images = [pic1, pic2, pic3];

const Hero3DImage = () => {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tilt effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for rotation
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  // Map mouse position to rotation degrees
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  useEffect(() => {
    let interval;
    if (isHovered) {
      interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % images.length);
      }, 2000); // Shuffle every 2 seconds
    } else {
      setIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className="relative w-full max-w-[450px] aspect-[4/5] mx-auto cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1500px" }}
    >
      <motion.div
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full h-full"
      >
        <AnimatePresence mode="popLayout">
          {images.map((src, i) => {
            // Only show the current image or the one transitioning out
            if (i !== index) return null;

            return (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  z: -200,
                  rotateY: -45,
                  scale: 0.8
                }}
                animate={{ 
                  opacity: 1, 
                  z: 0,
                  rotateY: 0,
                  scale: 1 
                }}
                exit={{ 
                  opacity: 0, 
                  z: 200,
                  rotateY: 45,
                  scale: 1.1
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 150,
                  damping: 25,
                  duration: 0.8
                }}
                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-white/20"
              >
                <motion.img 
                  src={src} 
                  alt={`Hero ${i + 1}`} 
                  className="w-full h-full object-cover"
                  style={{
                    scale: 1.1 // Slight zoom for parallax feel
                  }}
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-blue/20 to-transparent pointer-events-none" />
                
                {/* Glossy shine effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"
                  animate={{
                    translateX: isHovered ? ["-100%", "100%"] : "-100%"
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Decorative elements that follow the tilt */}
        <div 
          className="absolute -inset-10 bg-primary-blue/5 rounded-[3rem] blur-3xl -z-10"
          style={{ transform: "translateZ(-100px)" }}
        />
      </motion.div>
      
      {/* Visual Indicator of count */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <motion.div 
            key={i}
            className={`h-1.5 rounded-full ${i === index ? 'bg-primary-blue w-6' : 'bg-primary-blue/20 w-1.5'}`}
            animate={{ width: i === index ? 24 : 6 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero3DImage;
