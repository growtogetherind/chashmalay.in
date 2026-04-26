import React from 'react';
import { motion } from 'framer-motion';
import { Bluetooth, Mic, Phone, Navigation, Disc, ArrowRight } from 'lucide-react';
import './SmartySection.css';

const features = [
  {
    icon: <Disc size={24} />,
    title: 'Dual Speakers',
    desc: 'Immersive open-ear audio experience for music & calls.'
  },
  {
    icon: <Phone size={24} />,
    title: 'Hands-free Calling',
    desc: 'In-built mic for crystal clear conversations on the go.'
  },
  {
    icon: <Mic size={24} />,
    title: 'Voice Assistant',
    desc: 'Access Google/Siri with a simple touch on the frames.'
  },
  {
    icon: <Navigation size={24} />,
    title: 'Nav Assistance',
    desc: 'Voice-guided navigation directly to your ears.'
  }
];

const SmartySection = () => {
  return (
    <section className="smarty-section py-40 bg-[#0E0E0E] text-white overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#009688]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#48B6C7]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#48B6C7] mb-8 block">Next Gen Vision</span>
              <h2 className="text-6xl md:text-8xl font-black mb-12 tracking-tighter leading-none">
                TITAN <span className="text-[#009688]">EYE X.</span>
              </h2>
              <p className="text-white/50 text-xl leading-relaxed mb-16 max-w-lg">
                The smart glass that does it all. Experience clear vision combined with modern technology.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                {features.map((f, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center gap-4 mb-4 text-[#48B6C7]">
                      {f.icon}
                      <h3 className="text-sm font-black uppercase tracking-widest">{f.title}</h3>
                    </div>
                    <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              <button className="btn-oa bg-[#009688] border-[#009688] text-white hover:bg-white hover:text-black">
                Explore Smarty <ArrowRight size={16} />
              </button>
            </motion.div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
              className="relative w-full aspect-square max-w-xl"
            >
              {/* Product Glow */}
              <div className="absolute inset-0 bg-[#009688]/20 blur-[100px] rounded-full scale-75" />
              <img 
                src="/assets/im/eyeglasses.png" 
                alt="Titan EyeX" 
                className="w-full h-full object-contain relative z-10 brightness-110 drop-shadow-[0_20px_50px_rgba(0,150,136,0.5)]" 
              />
              
              {/* Feature Tags */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[10%] right-[-5%] bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10"
              >
                <span className="text-[10px] font-black tracking-widest uppercase">Bluetooth 5.0</span>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[20%] left-[-5%] bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10"
              >
                <span className="text-[10px] font-black tracking-widest uppercase">6H Battery</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmartySection;
