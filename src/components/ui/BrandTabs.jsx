import React from 'react';
import { motion } from 'framer-motion';
import './BrandTabs.css';

const brands = [
  'Ray-Ban', 'Oakley', 'Vogue', 'Titan', 'Fastrack', 'Arnette', 'Swarovski', 'Burberry',
  'Ray-Ban', 'Oakley', 'Vogue', 'Titan', 'Fastrack', 'Arnette', 'Swarovski', 'Burberry'
];

const BrandTabs = () => {
  return (
    <section className="px-18 max-md:px-8 flex w-full flex-col items-center justify-center gap-30 px-0! md:items-start py-20 bg-white">
      <div className="container overflow-hidden w-full my-20 overflow-x-hidden" role="button" tabIndex="0" aria-pressed="false">
        <header className="mb-12 overflow-hidden perspective-[1000px]">
           <motion.h2 
             initial={{ rotateX: 90, opacity: 0 }}
             whileInView={{ rotateX: 0, opacity: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
             className="text-3xl md:text-5xl font-black tracking-tight text-[#161616]"
           >
             SHOP BY <br /> <span className="serif-oa italic text-[#009688]">DESIGNER.</span>
           </motion.h2>
        </header>

        <div className="marquee-container flex gap-0" style={{ width: 'max-content', animation: '20s linear 0s infinite normal none running marquee-left' }}>
          {/* If the user has the companiesLogo.png image, we can use it. 
              For now, using the brand names in a stylish way. */}
          {brands.map((brand, i) => (
            <div key={i} className="md:h-[67.45px] pr-32 h-16 flex items-center justify-center">
              <span className="text-3xl md:text-5xl font-black text-black/10 hover:text-[#009688] transition-colors uppercase tracking-widest whitespace-nowrap">
                {brand}
              </span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {brands.map((brand, i) => (
            <div key={`dup-${i}`} className="md:h-[67.45px] pr-32 h-16 flex items-center justify-center">
              <span className="text-3xl md:text-5xl font-black text-black/10 hover:text-[#009688] transition-colors uppercase tracking-widest whitespace-nowrap">
                {brand}
              </span>
            </div>
          ))}
        </div>

        <style>
          {`
            @keyframes marquee-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes marquee-right {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
          `}
        </style>
      </div>
    </section>
  );
};

export default BrandTabs;
