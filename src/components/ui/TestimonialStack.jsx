import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import './TestimonialStack.css';

const testimonials = [
  {
    id: 1,
    name: "Arjun Sharma",
    role: "Verified Buyer",
    rating: 5,
    comment: "The Titan EyeX is a game changer. The audio quality for pods and calls is surprisingly good for something built into glasses.",
    date: "2 days ago"
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Studio Collection",
    rating: 5,
    comment: "Absolutely love the architectural frames. They feel premium and look stunning with everything.",
    date: "1 week ago"
  },
  {
    id: 3,
    name: "Vikram Singh",
    role: "Tech Enthusiast",
    rating: 4,
    comment: "Precision lens fitting and smooth overall experience. Hands-free calling is super useful during my commute.",
    date: "2 weeks ago"
  }
];

const TestimonialStack = () => {
  return (
    <section className="testimonial-section py-40 bg-white">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#009688] mb-4 block">Our Community</span>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[#161616] mb-12">
                WHAT THEY <br /> <span className="serif-oa italic text-black/30">EXPERIENCE.</span>
              </h2>
              <div className="flex gap-2 mb-8">
                 {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#009688" color="#009688" />)}
              </div>
              <p className="text-black/40 text-lg uppercase tracking-widest font-black">
                4.8/5 based on 2,500+ reviews
              </p>
           </div>

           <div className="testimonial-stack-container relative h-[400px]">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 50, rotate: 0 }}
                  whileInView={{ 
                    opacity: 1, 
                    y: i * 40 - (testimonials.length * 20),
                    rotate: i % 2 === 0 ? 2 : -2,
                    scale: 1 - i * 0.05
                  }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
                  className="testimonial-card absolute inset-0 m-auto h-fit"
                  style={{ zIndex: testimonials.length - i }}
                >
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-black/5">
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <h4 className="text-sm font-black uppercase tracking-widest">{t.name}</h4>
                           <p className="text-[10px] text-black/40 uppercase tracking-widest">{t.role}</p>
                        </div>
                        <span className="text-[10px] font-bold text-black/20 uppercase">{t.date}</span>
                     </div>
                     <p className="text-[#161616] text-xl font-medium leading-relaxed italic">
                       "{t.comment}"
                     </p>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialStack;
