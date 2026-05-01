import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Parse prices and calculate discount
  const price = parseInt((product.consumersPrice || product.price || "0").toString().replace(/,/g, ''));
  const originalPrice = product.originalPrice ? parseInt(product.originalPrice.toString().replace(/,/g, '')) : Math.round(price * 1.3);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  const colors = product.colors || [];

  return (
    <div 
      className="product-card-oa group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="product-card-image-wrapper aspect-[4/3] p-6">
          {/* Wishlist Button */}
          <button 
            className="wishlist-btn"
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
          >
            <Heart 
              size={20} 
              fill={isWishlisted ? "#ff4d4d" : "none"} 
              color={isWishlisted ? "#ff4d4d" : "#1a1a1a"} 
              strokeWidth={1.5} 
            />
          </button>

          {/* Rating Badge */}
          <div className="rating-badge">
            {product.rating || '4.8'} <Star size={10} fill="currentColor" /> 
            <div className="w-px h-2.5 bg-divider mx-0.5" />
            <span className="rating-count">{product.reviewCount || '1.2K'}</span>
          </div>
          
          <AnimatePresence mode="popLayout">
            <motion.img 
              key={isHovered && product.model_image ? 'model' : 'frame'}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: isHovered ? 1.05 : 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              src={isHovered && product.model_image ? product.model_image : (product.frameImage || product.frame_image)} 
              alt={product.name} 
              className="w-full h-full object-contain drop-shadow-sm"
              loading="lazy"
            />
          </AnimatePresence>

          {/* New Arrival Badge */}
          {(product.isNew || product.is_new) && (
            <div className="absolute top-4 left-4">
              <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-accent px-2 py-1 bg-white/80 backdrop-blur-sm rounded border border-accent/20">
                New
              </span>
            </div>
          )}
        </div>
        
        <div className="product-info-v2">
          <h4 className="product-brand">{product.brand || 'Chashmaly'}</h4>
          <p className="product-details-subtitle truncate">
            {product.name} • {product.size || 'Medium'}
          </p>

          {/* Color Swatches */}
          <div className="color-swatches">
            {colors.slice(0, 3).map((c, i) => (
              <div 
                key={i} 
                className="color-dot" 
                style={{ backgroundColor: c.hex || '#1a1a1a' }} 
              />
            ))}
            {colors.length > 3 && (
              <span className="color-more">+{colors.length - 3}</span>
            )}
            {colors.length === 0 && (
               <>
                 <div className="color-dot bg-black" />
                 <div className="color-dot bg-gray-400" />
                 <div className="color-dot bg-amber-900" />
               </>
            )}
          </div>

          <div className="pricing-row">
            <span className="current-price">₹{price.toLocaleString()}</span>
            <span className="original-price">₹{originalPrice.toLocaleString()}</span>
            <span className="discount-tag">({discountPercent}% OFF)</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
