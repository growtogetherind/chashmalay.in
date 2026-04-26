import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-flat rounded-2xl mb-6 border border-transparent transition-all duration-500 ease-cinema group-hover:border-divider group-hover:shadow-luxury-hover group-hover:-translate-y-2 p-4">
          
          <AnimatePresence mode="popLayout">
            <motion.img 
              key={isHovered ? 'model' : 'frame'}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: isHovered ? 1.05 : 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
              src={isHovered ? (product.modelImage || product.model_image) : (product.frameImage || product.frame_image)} 
              alt={product.name} 
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </AnimatePresence>

          {/* Luxury Badge */}
          <div className="absolute top-6 left-6">
            {(product.isNew || product.is_new) && (
                <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                  <div className="w-1 h-1 bg-accent rounded-full" /> Edition 2024
                </span>
            )}
          </div>

          {/* Link Indicator */}
          <div className="absolute top-6 right-6 text-secondary/40 group-hover:text-accent transition-colors duration-500">
              <ArrowUpRight size={20} strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="px-2">
            <div className="flex justify-between items-end">
              <div>
                  <h3 className="text-secondary tracking-widest uppercase text-xs font-sans font-light mb-1">{product.category || 'Optical'}</h3>
                  <p className="text-2xl font-serif text-primary tracking-tight">{product.name}</p>
              </div>
              <div className="text-right">
                  <p className="text-lg text-primary tracking-wide">₹{product.price}</p>
              </div>
            </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
