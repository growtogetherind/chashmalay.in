import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';

const COLOR_SWATCH_MAP = {
  Black: '#000000',
  Gold: '#D4AF37',
  Silver: '#C0C0C0',
  Gunmetal: '#2C3539',
  Transparent: '#F1F5F9',
  Brown: '#5C4033',
  Blue: '#1E3A8A',
  'Rose Gold': '#B76E79',
  Green: '#16A34A',
  Gray: '#9CA3AF',
  Grey: '#9CA3AF',
  Clear: '#FFFFFF',
  Honey: '#D97706',
  Hazel: '#8B5E34',
};

const getColorLabel = (color) => {
  if (!color) return '';
  return typeof color === 'string'
    ? color
    : color.name || color.label || color.color || color.hex || '';
};

const getColorValue = (color) => {
  const label = getColorLabel(color);
  if (!label) return '#E5E7EB';
  if (typeof color === 'object' && color.hex) return color.hex;
  return COLOR_SWATCH_MAP[label] || (/^#[0-9a-f]{3,8}$/i.test(label) ? label : '#E5E7EB');
};

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
  const colorCandidates = Array.isArray(product.colors) && product.colors.length
    ? product.colors
    : [product.color || product.frame_color || product.frameColor].filter(Boolean);
  const colors = colorCandidates.filter((color) => {
    const label = getColorLabel(color).trim().toLowerCase();
    return label && label !== 'standard' && label !== 'default';
  });

  const isContactLens = product.category?.toLowerCase().includes('contact');
  const productPath = isContactLens ? `/contact-lens/${product.id}` : `/product/${product.id}`;

  return (
    <div
      className="group bg-white border border-gray-100 rounded overflow-hidden hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Area */}
      <Link to={productPath} className="block relative overflow-hidden aspect-[4/3] bg-gray-50">
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{discountPercent}%
          </span>
        )}

        {/* Wishlist */}
        <button
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-blue-200 transition-colors shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
        >
          <Heart
            size={13}
            fill={isWishlisted ? '#dc2626' : 'none'}
            className={isWishlisted ? 'text-primary' : ''}
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

      </Link>

      {/* Info Area */}
      <div className="p-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
          {product.brand || 'Chashmaly'}
        </p>
        <Link to={productPath} className="block">
          <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 hover:text-primary transition-colors mb-1">
            {product.name}
          </h4>
        </Link>
        <p className="text-[10px] text-gray-400 mb-2 capitalize">
          {product.category?.toLowerCase().includes('contact')
            ? `${product.disposable_type || 'Monthly'} • ${product.pack_size || '6 Lenses'}`
            : (product.frame_shape || product.frameShape || product.category || 'Eyeglasses')}
        </p>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex gap-1 mb-2">
            {colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-full border border-gray-200 inline-block"
                style={{ backgroundColor: getColorValue(c) }}
                title={getColorLabel(c)}
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
