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

  return (
    <div
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-gray-200/50 transition-all duration-300 transform hover:-translate-y-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Area */}
      <Link to={productPath} className="block relative overflow-hidden aspect-[4/3] bg-gray-50">
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-3 left-3 z-10 bg-primary text-white text-[11px] md:text-xs font-extrabold px-2.5 py-1 rounded-md shadow-sm">
            -{discountPercent}%
          </span>
        )}

        {/* Wishlist */}
        <button
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/80 flex items-center justify-center text-gray-400 hover:text-[#dc2626] hover:border-red-100 hover:bg-white transition-all duration-300 shadow-md hover:scale-110"
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

        {/* Product Image */}
        <img
          src={transformCloudinaryUrl(activeImage, { width: 640 })}
          srcSet={activeImage.includes('res.cloudinary.com') ? getCloudinarySrcSet(activeImage, [320, 480, 640, 800]) : undefined}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          alt={product.name}
          width="640"
          height="480"
          className="w-full h-full object-contain mix-blend-multiply p-4 md:p-5 transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300/f5f5f5/999?text=No+Image'; }}
        />

      </Link>

      {/* Info Area */}
      <div className="p-3 md:p-6">
        <p className="text-[9px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 md:mb-2">
          {product.brand || 'Chashmalay'}
        </p>
        <Link to={productPath} className="block">
          <h4 className="text-xs md:text-lg font-normal text-slate-900 line-clamp-2 hover:text-primary transition-colors mb-1 md:mb-2">
            {product.name}
          </h4>
        </Link>
        <p className="text-[10px] md:text-sm text-slate-500 font-normal mb-2 md:mb-4 capitalize">
          {product.category?.toLowerCase().includes('contact')
            ? `${product.disposable_type || 'Monthly'} • ${product.pack_size || '6 Lenses'}`
            : (product.frame_shape || product.frameShape || product.category || 'Eyeglasses')}
        </p>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex gap-2.5 mb-4">
            {colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="w-6 h-6 rounded-full border border-gray-200 inline-block transition-transform hover:scale-115 shadow-sm"
                style={{ background: typeof c === 'object' && c.is_dual_tone && c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : getColorValue(c) }}
                title={getColorLabel(c)}
              />
            ))}
          </div>
        )}

        {/* Price Row */}
        <div className="flex items-center justify-between mt-2 md:mt-2.5 pt-2 border-t border-gray-50">
          <div className="flex items-baseline gap-1.5 md:gap-2.5">
            <span className="text-sm md:text-xl font-medium text-slate-900">₹{price.toLocaleString()}</span>
            {originalPrice > price && (
              <span className="text-[9px] md:text-xs text-slate-400 line-through font-normal">₹{originalPrice.toLocaleString()}</span>
            )}
          </div>
          {/* Stock indicator dots (like the reference) */}
          <div className="flex gap-1.5 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse" title="In Stock" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" title="Limited" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
