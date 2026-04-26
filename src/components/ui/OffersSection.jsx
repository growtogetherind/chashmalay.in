import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Zap, Gift, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOffers } from '../../lib/firebase';

const OffersSection = () => {
  const [offers, setOffers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      const { data } = await getOffers();
      setOffers(data?.filter(o => o.is_active) || []);
      setLoading(false);
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [offers.length]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % offers.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + offers.length) % offers.length);

  if (loading) return <div className="py-20 text-center text-gray-400 font-bold animate-shimmer">Loading amazing offers...</div>;
  if (offers.length === 0) return null;

  return (
    <section className="py-12 relative overflow-hidden flex items-center justify-center min-h-[500px] my-8 rounded-[3rem] container mx-auto shadow-sm">
      {/* Dynamic Background */}
      <AnimatePresence mode="wait">
         <motion.div 
           key={current}
           initial={{ opacity: 0, scale: 1.1 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 1.2 }}
           className="absolute inset-0 z-0"
           style={{ 
             backgroundImage: `url(${offers[current].bg_image || ''})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center'
           }}
         >
           <div className={`absolute inset-0 bg-gradient-to-r ${offers[current].color_preset || 'from-blue-600/80 to-indigo-900/80'}`} />
           <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 text-white">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.3em] mb-4 inline-block">
                  {offers[current].code || 'Special Offer'}
                </span>
                <h2 className="text-4xl md:text-6xl font-black mb-4 italic uppercase tracking-tighter">
                  {offers[current].title}
                </h2>
                <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-90 leading-relaxed mb-8">
                  {offers[current].description}
                </p>
                <div className="flex gap-4 justify-center">
                  <a href="/offers" className="px-8 py-3 bg-white text-slate-900 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform">
                    View Details
                  </a>
                </div>
              </motion.div>
           </div>
         </motion.div>
      </AnimatePresence>

      <div className="container relative z-10 w-full h-full flex flex-col justify-end pb-12 items-center">
          {/* Navigation Controls - Minimal Dots */}
          <div className="flex justify-center items-center gap-4 px-6 py-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
            <button onClick={prevSlide} className="p-2 rounded-full hover:bg-white/20 transition-all text-white">
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
               {offers.map((_, i) => (
                 <button 
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? 'w-8 bg-white' : 'w-1.5 bg-white/30'}`}
                 />
               ))}
            </div>
            <button onClick={nextSlide} className="p-2 rounded-full hover:bg-white/20 transition-all text-white">
              <ChevronRight size={18} />
            </button>
          </div>
      </div>


      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }
      `}</style>
    </section>
  );
};

export default OffersSection;
