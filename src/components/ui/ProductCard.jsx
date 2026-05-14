import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const price = parseInt((product.consumersPrice || product.price || "0").toString().replace(/,/g, ''));
  const originalPrice = product.original_price || product.originalPrice
    ? parseInt((product.original_price || product.originalPrice).toString().replace(/,/g, ''))
    : Math.round(price * 1.3);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  const frontImage = product.images?.front || product.frameImage || product.frame_image || product.image || product.images?.gallery?.[0] || 'https://via.placeholder.com/400x300/f5f5f5/999?text=No+Image';
  const hoverImage = product.images?.model || product.model_image || product.images?.gallery?.[1] || frontImage;

  const colors = product.colors || [];

  return (
    <div
      className="group bg-white border border-gray-100 rounded overflow-hidden hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Area */}
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-[4/3] bg-gray-50">
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{discountPercent}%
          </span>
        )}

        {/* Wishlist */}
        <button
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
        >
          <Heart
            size={13}
            fill={isWishlisted ? '#dc2626' : 'none'}
            className={isWishlisted ? 'text-red-600' : ''}
          />
        </button>

        {/* Product Image */}
        <img
          src={isHovered ? hoverImage : frontImage}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply p-3 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300/f5f5f5/999?text=No+Image'; }}
        />

        {/* Quick Add overlay on hover */}
        <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-white/90 py-2 text-xs font-semibold text-gray-700 transition-all duration-200 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <button
            className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-700 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // In a real app, this might trigger a quick-add function
            }}
          >
            <ShoppingCart size={12} /> ADD TO CART
          </button>
        </div>
      </Link>

      {/* Info Area */}
      <div className="p-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
          {product.brand || 'Chashmaly'}
        </p>
        <Link to={`/product/${product.id}`} className="block">
          <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 hover:text-red-600 transition-colors mb-1">
            {product.name}
          </h4>
        </Link>
        <p className="text-[10px] text-gray-400 mb-2 capitalize">{product.frame_shape || product.frameShape || product.category || 'Eyeglasses'}</p>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex gap-1 mb-2">
            {colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-full border border-gray-200 inline-block"
                style={{ backgroundColor: c.hex || c }}
                title={c.name || c}
              />
            ))}
          </div>
        )}

        {/* Price Row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-gray-900">₹{price.toLocaleString()}</span>
            {originalPrice > price && (
              <span className="text-xs text-gray-400 line-through">₹{originalPrice.toLocaleString()}</span>
            )}
          </div>
          {/* Stock indicator dots (like the reference) */}
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="In Stock" />
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" title="Limited" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
