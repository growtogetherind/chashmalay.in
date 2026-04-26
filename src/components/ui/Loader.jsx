import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Loader.css';

const Loader = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsComplete(true), 500);
          setTimeout(() => onLoadingComplete(), 1200);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
          exit={{ y: '-100%', transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] } }}
        >
          <div className="loader-content flex flex-col items-center">
            {/* 3D Text Animation for Logo */}
            <motion.div 
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
              className="perspective-[1000px]"
            >
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[#161616]">
                CHASHMALY<span className="text-[#009688]">.IN</span>
              </h1>
            </motion.div>
            
            <div className="mt-8 w-48 h-[2px] bg-black/5 relative overflow-hidden">
               <motion.div 
                 className="absolute inset-y-0 left-0 bg-[#009688]"
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
               />
            </div>
            
            <motion.span 
              className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-black/20"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Vision is loading
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;
