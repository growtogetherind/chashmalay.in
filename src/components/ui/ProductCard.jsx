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
    <Link 
      to={`/product/${product.id}`} 
      className="product-card-oa group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-card-image-wrapper aspect-[4/3] p-6 relative overflow-hidden">
        {/* Wishlist Button - Handled with preventDefault to avoid navigation */}
        <button 
          className="wishlist-btn z-20"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
        <div className="rating-badge z-10">
          {product.rating || '4.8'} <Star size={10} fill="currentColor" /> 
          <div className="w-px h-2.5 bg-divider mx-0.5" />
          <span className="rating-count">{product.reviewCount || '1.2K'}</span>
        </div>
        
        {/* Simplified Image - No AnimatePresence for faster response */}
        <img 
          src={isHovered && product.model_image ? product.model_image : (product.frameImage || product.frame_image)} 
          alt={product.name} 
          className="w-full h-full object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-105 pointer-events-none"
          loading="lazy"
        />

        {/* New Arrival Badge */}
        {(product.isNew || product.is_new) && (
          <div className="absolute top-4 left-4 z-10">
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
          {(product.colors || []).slice(0, 3).map((c, i) => (
            <div 
              key={i} 
              className="color-dot" 
              style={{ backgroundColor: c.hex || '#1a1a1a' }} 
            />
          ))}
          {product.colors?.length > 3 && (
            <span className="color-more">+{product.colors.length - 3}</span>
          )}
          {(!product.colors || product.colors.length === 0) && (
             <div className="flex gap-1.5">
               <div className="color-dot bg-black" />
               <div className="color-dot bg-gray-400" />
               <div className="color-dot bg-amber-900" />
             </div>
          )}
        </div>

        <div className="pricing-row">
          <span className="current-price">₹{price.toLocaleString()}</span>
          <span className="original-price">₹{originalPrice.toLocaleString()}</span>
          <span className="discount-tag">({discountPercent}% OFF)</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
