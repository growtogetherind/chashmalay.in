import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { getCloudinarySrcSet, transformCloudinaryUrl } from '../../lib/cloudinary';

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
  if (!color) return '#E5E7EB';
  if (typeof color === 'object') {
    if (color.hex) return color.hex;
    if (color.color_code) return color.color_code;
    if (color.colorCode) return color.colorCode;
  }
  const label = getColorLabel(color);
  if (!label) return '#E5E7EB';
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
  const activeImage = isHovered ? hoverImage : frontImage;
  const baseColorName = product.color || product.frame_color || product.frameColor;
  const baseColorHex = product.color_hex || product.colorHex;

  const getCleanLabel = (c) => {
    if (!c) return '';
    return (typeof c === 'string' ? c : c.name || c.color || c.hex || '').trim().toLowerCase();
  };

  const colors = (() => {
    const rawColors = Array.isArray(product.colors) ? product.colors : [];
    if (rawColors.length > 0) {
      const hasBase = baseColorName && rawColors.some(c => getCleanLabel(c) === baseColorName.toLowerCase());
      if (hasBase) {
        return rawColors;
      } else if (baseColorName) {
        return [
          {
            name: baseColorName,
            hex: baseColorHex || '#e2e8f0',
            is_dual_tone: product.is_dual_tone || false,
            hex2: product.hex2 || product.dual_color_hex || null
          },
          ...rawColors
        ];
      }
      return rawColors;
    }
    if (baseColorName) {
      return [
        {
          name: baseColorName,
          hex: baseColorHex || '#e2e8f0',
          is_dual_tone: product.is_dual_tone || false,
          hex2: product.hex2 || product.dual_color_hex || null
        }
      ];
    }
    return [];
  })().filter(c => {
    const label = getCleanLabel(c);
    return label && label !== 'standard' && label !== 'default';
  });

  const isContactLens = product.category?.toLowerCase().includes('contact');
  const productPath = isContactLens ? `/contact-lens/${product.id}` : `/product/${product.id}`;

  const recordLastViewed = () => {
    sessionStorage.setItem('last_viewed_frame_id', product.id);
  };

  return (
    <div
      id={`product-${product.id}`}
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-gray-200/80 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Area - enlarged frame image with minimal padding */}
      <Link
        to={productPath}
        onClick={recordLastViewed}
        className="block relative overflow-hidden aspect-[16/11] bg-slate-50/60 flex items-center justify-center"
      >
        {/* Discount Badge (Clean positive percentage e.g. 33% instead of -33%) */}
        {discountPercent > 0 && (
          <span className="absolute top-3.5 left-3.5 z-10 bg-primary text-white text-[11px] md:text-xs font-black px-2.5 py-1 rounded-md shadow-sm">
            {discountPercent}%
          </span>
        )}

        {/* Wishlist */}
        <button
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/80 flex items-center justify-center text-gray-400 hover:text-[#dc2626] hover:border-red-100 hover:bg-white transition-all duration-300 shadow-md hover:scale-110"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
        >
          <Heart
            size={16}
            fill={isWishlisted ? '#dc2626' : 'none'}
            className={isWishlisted ? 'text-primary' : ''}
          />
        </button>

        {/* Product Image - Large frame showcase */}
        <img
          src={transformCloudinaryUrl(activeImage, { width: 800 })}
          srcSet={activeImage.includes('res.cloudinary.com') ? getCloudinarySrcSet(activeImage, [360, 540, 720, 960]) : undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          alt={product.name}
          width="800"
          height="550"
          className="w-full h-full object-contain mix-blend-multiply p-2 sm:p-3 md:p-4 transition-transform duration-500 group-hover:scale-108"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300/f5f5f5/999?text=No+Image'; }}
        />
      </Link>

      {/* Info Area */}
      <div className="p-4 md:p-6 flex flex-col flex-1 justify-between">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            {product.brand || 'Chashmalay'}
          </p>
          <Link to={productPath} onClick={recordLastViewed} className="block">
            <h4 className="text-sm md:text-lg font-medium text-slate-900 line-clamp-2 hover:text-primary transition-colors mb-1.5">
              {product.name}
            </h4>
          </Link>
          <p className="text-xs md:text-sm text-slate-500 font-normal mb-3 capitalize">
            {product.category?.toLowerCase().includes('contact')
              ? `${product.disposable_type || 'Monthly'} • ${product.pack_size || '6 Lenses'}`
              : (product.frame_shape || product.frameShape || product.category || 'Eyeglasses')}
          </p>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="flex gap-2 mb-3">
              {colors.slice(0, 5).map((c, i) => (
                <span
                  key={i}
                  className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-gray-200 inline-block transition-transform hover:scale-115 shadow-sm"
                  style={{ background: typeof c === 'object' && c.is_dual_tone && c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : getColorValue(c) }}
                  title={getColorLabel(c)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Price Row */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
          <div className="flex items-baseline gap-2">
            <span className="text-base md:text-xl font-bold text-slate-900">₹{price.toLocaleString()}</span>
            {originalPrice > price && (
              <span className="text-xs md:text-sm text-slate-400 line-through font-normal">MRP ₹{originalPrice.toLocaleString()}</span>
            )}
          </div>
          {/* Stock indicator */}
          <div className="flex gap-1.5 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="In Stock" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">In Stock</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
