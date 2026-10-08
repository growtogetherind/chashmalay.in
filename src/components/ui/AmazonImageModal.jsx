import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { transformCloudinaryUrl } from '../../lib/cloudinary';

export default function AmazonImageModal({
  isOpen,
  onClose,
  images = [],
  activeImage = 0,
  onActiveImageChange,
  product = {},
  selectedColor = null,
  selectedSize = null,
}) {
  const [currentIndex, setCurrentIndex] = useState(activeImage);

  // Sync active index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(activeImage);
    }
  }, [isOpen, activeImage]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImgUrl = images[currentIndex] || images[0] || '';
  const hasMultiple = images.length > 1;

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (!hasMultiple) return;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIdx);
    if (onActiveImageChange) onActiveImageChange(prevIdx);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (!hasMultiple) return;
    const nextIdx = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIdx);
    if (onActiveImageChange) onActiveImageChange(nextIdx);
  };

  const handleThumbClick = (idx) => {
    setCurrentIndex(idx);
    if (onActiveImageChange) onActiveImageChange(idx);
  };

  const colorName = selectedColor?.name || product?.color || product?.frame_color || 'Standard';
  const sizeName = selectedSize || product?.size || 'Standard';

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amazon-style Top Tab Bar */}
        <div className="flex items-center justify-between px-6 pt-3.5 pb-1 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 border-b-2 border-teal-600 pb-3 cursor-default">
              IMAGES
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors mb-2"
            title="Close (Esc)"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Amazon-style Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-8 overflow-y-auto">
          {/* Left Column: Big Image Viewport */}
          <div className="md:col-span-8 flex items-center justify-center min-h-[380px] md:min-h-[480px] relative bg-slate-50/60 rounded-xl p-4 border border-slate-100">
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-md transition-all hover:scale-105 z-10"
                  title="Previous image"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-md transition-all hover:scale-105 z-10"
                  title="Next image"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <img
              src={transformCloudinaryUrl(currentImgUrl, { width: 1800 })}
              alt={product?.name || 'Product enlarged'}
              className="max-h-[60vh] max-w-full object-contain drop-shadow-sm select-none"
              draggable={false}
            />
          </div>

          {/* Right Column: Title, Attributes, Thumbnails (Exact Amazon layout) */}
          <div className="md:col-span-4 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {product?.brand && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100 w-fit inline-block">
                  {product.brand}
                </span>
              )}
              <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug tracking-tight">
                {product?.name || 'Product Details'}
              </h2>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <p>
                  <span className="font-semibold text-slate-700">Colour:</span>{' '}
                  <span className="text-slate-900 font-medium">{colorName}</span>
                </p>
                {sizeName && (
                  <p>
                    <span className="font-semibold text-slate-700">Size:</span>{' '}
                    <span className="text-slate-900 font-medium">{sizeName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-2.5">
                All Photos ({images.length}):
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleThumbClick(idx)}
                    className={`aspect-square rounded-lg border-2 overflow-hidden p-1 bg-white transition-all ${
                      idx === currentIndex
                        ? 'border-teal-700 ring-2 ring-teal-700/25 scale-105 shadow-sm'
                        : 'border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={transformCloudinaryUrl(img, { width: 160 })}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
