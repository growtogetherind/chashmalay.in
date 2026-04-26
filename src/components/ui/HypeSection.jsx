import React from 'react';
import { motion } from 'framer-motion';
import { Camera, ArrowRight } from 'lucide-react';
import './HypeSection.css';

const reels = [
  { id: 1, videoUrl: 'https://www.instagram.com/p/DXZN342CLj7/embed' },
  { id: 2, videoUrl: 'https://www.instagram.com/p/DXgjNkOCKX2/embed' },
  { id: 3, videoUrl: 'https://www.instagram.com/p/DXjtcJuiM3t/embed' },
  { id: 4, videoUrl: 'https://www.instagram.com/p/DXZN342CLj7/embed' },
];

const HypeSection = () => {
  return (
    <section className="hype-section py-60 overflow-hidden relative">
      {/* Mood Board Background - More Structured & Premium */}
      <div className="absolute inset-x-0 top-0 h-[500px] pointer-events-none overflow-hidden opacity-[0.07] flex justify-center items-start pt-20">
         <div className="relative w-full max-w-7xl flex justify-around">
            <img src="/assets/im/poster1.png" className="w-[300px] h-[400px] object-cover rotate-[-12deg] rounded-3xl mix-blend-multiply" alt="" />
            <img src="/assets/im/eyeglasses.png" className="w-[300px] h-[400px] object-cover rotate-[8deg] translate-y-20 rounded-3xl mix-blend-multiply" alt="" />
            <img src="/assets/im/poster2.png" className="w-[300px] h-[400px] object-cover rotate-[-5deg] -translate-y-10 rounded-3xl mix-blend-multiply" alt="" />
            <img src="/assets/im/sunglasses.png" className="w-[300px] h-[400px] object-cover rotate-[15deg] translate-y-32 rounded-3xl mix-blend-multiply" alt="" />
         </div>
      </div>

      <div className="container relative z-10">
        <header className="flex flex-col items-center text-center mb-32 px-4">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-[10px] font-black uppercase tracking-[0.6em] text-[#A68B67] mb-6 mb-8"
          >
            Digital Community
          </motion.h2>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[#161616] flex items-baseline gap-4">
            JOIN THE <span className="serif-oa italic text-5xl md:text-7xl font-light text-black/30">Hype</span>
          </h2>
          <div className="w-20 h-1 bg-[#161616] mt-12 opacity-5" />
        </header>

        <div className="reels-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 px-4 md:px-0">
          {reels.map((reel, idx) => (
            <motion.div
              key={reel.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 1, ease: [0.19, 1, 0.22, 1] }}
              className="reel-card-minimal group"
            >
              <div className="aspect-[9/16] rounded-[3rem] overflow-hidden bg-white border border-black/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] group-hover:shadow-[0_45px_90px_-20px_rgba(0,0,0,0.15)] group-hover:-translate-y-4 transition-all duration-700">
                 <iframe 
                   src={reel.videoUrl} 
                   className="w-full h-full border-none grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                   allowtransparency="true" 
                   allow="encrypted-media"
                   scrolling="no"
                 />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-32 flex flex-col items-center gap-6">
           <a href="https://instagram.com" target="_blank" rel="noreferrer" className="group text-[11px] font-black uppercase tracking-[0.4em] text-[#161616] hover:text-[#009688] transition-all flex flex-col items-center gap-4">
              <span>Follow Us @CHASHMALY</span>
              <div className="w-12 h-px bg-black opacity-10 group-hover:w-24 group-hover:opacity-100 transition-all duration-700" />
           </a>
        </div>
      </div>
    </section>
  );
};

export default HypeSection;
