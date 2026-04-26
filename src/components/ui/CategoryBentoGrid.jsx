import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './CategoryBentoGrid.css';

const categories = [
  {
    id: 'eyeglasses',
    name: 'Eyeglasses',
    count: '2000+ Styles',
    image: '/assets/im/eyeglasses1.png',
    link: '/category/eyeglasses',
    size: 'large',
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    count: '1500+ Styles',
    image: '/assets/im/sunglasses.png',
    link: '/category/sunglasses',
    size: 'large',
  },
  {
    id: 'contact-lenses',
    name: 'Contact Lenses',
    count: 'All Powers',
    image: '/assets/im/lens.png',
    link: '/category/contacts',
    size: 'small',
  },
];

const CategoryBentoGrid = () => {
  return (
    <section className="category-bento-section py-32">
      <div className="container">
        <header className="perspective-cinema text-center mb-16 px-4">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#161616]">
            <motion.span
              initial={{ rotateX: 90, y: 50, opacity: 0 }}
              whileInView={{ rotateX: 0, y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
              className="text-3d-reveal inline-block mr-2"
            >
              Shop by
            </motion.span>
            <motion.span
              initial={{ rotateX: 90, y: 50, opacity: 0 }}
              whileInView={{ rotateX: 0, y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
              className="serif-oa italic text-[#009688] inline-block"
            >
              Category
            </motion.span>
          </h2>
        </header>

        <div className="bento-grid">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 1, ease: [0.19, 1, 0.22, 1] }}
              className={`bento-item ${cat.size}`}
            >
              <Link to={cat.link} className="bento-card-link">
                <div className="bento-image-wrapper">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="bento-image" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                
                <div className="bento-content relative z-10 h-full flex flex-col justify-end p-8 text-white">
                  <h3 className="text-xl md:text-2xl font-black tracking-widest mb-1 uppercase leading-none">{cat.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">{cat.count}</p>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-[#009688] transition-all">
                       <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryBentoGrid;
