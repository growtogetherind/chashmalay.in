import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ZoomIn, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { transformCloudinaryUrl, getCloudinarySrcSet } from '../../lib/cloudinary';
import AmazonImageModal from './AmazonImageModal';
import './ProductImageZoom.css';

export default function ProductImageZoom({
  images = [],
  activeImage = 0,
  onActiveImageChange,
  product = {},
  productName = 'Product',
  className = '',
  imageLoading = false,
  setImageLoading,
  extraTopRight = null,
  selectedColor = null,
  selectedSize = null,
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Layout & positioning measurements
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [lensPos, setLensPos] = useState({ x: 0, y: 0, width: 200, height: 200, visible: false });
  const [flyoutSize, setFlyoutSize] = useState({ width: 560, height: 560 });

  const ZOOM_FACTOR = 2.6; // High definition zoom magnification
  const activeImageUrl = images[activeImage] || images[0] || '';

  // Detect touch screens
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 || 
        window.matchMedia('(hover: none)').matches
      );
    };
    checkTouch();
  }, []);

  // Update container size on resize or load
  const updateSizes = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });

    // Amazon flyout dimensions: adjust based on available space to the right
    const availableWidthOnRight = window.innerWidth - rect.right - 36;
    const computedFlyoutWidth = Math.max(380, Math.min(600, availableWidthOnRight));
    const computedFlyoutHeight = Math.min(540, Math.max(380, rect.height));

    setFlyoutSize({ width: computedFlyoutWidth, height: computedFlyoutHeight });

    // Proportional lens dimensions
    const lensW = Math.min(rect.width * 0.6, computedFlyoutWidth / ZOOM_FACTOR);
    const lensH = Math.min(rect.height * 0.6, computedFlyoutHeight / ZOOM_FACTOR);

    setLensPos(prev => ({ ...prev, width: lensW, height: lensH }));
  }, []);

  useEffect(() => {
    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, [updateSizes]);

  const handleMouseEnter = () => {
    if (isTouchDevice || window.innerWidth < 1024) return;
    updateSizes();
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setLensPos(prev => ({ ...prev, visible: false }));
  };

  const handleMouseMove = (e) => {
    if (isTouchDevice || window.innerWidth < 1024 || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (
      clientX < rect.left || 
      clientX > rect.right || 
      clientY < rect.top || 
      clientY > rect.bottom
    ) {
      setIsHovering(false);
      setLensPos(prev => ({ ...prev, visible: false }));
      return;
    }

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Calculate lens position centered around mouse cursor, bounded strictly within container
    const lensW = lensPos.width;
    const lensH = lensPos.height;

    let lx = mouseX - lensW / 2;
    let ly = mouseY - lensH / 2;

    lx = Math.max(0, Math.min(rect.width - lensW, lx));
    ly = Math.max(0, Math.min(rect.height - lensH, ly));

    setLensPos({
      x: lx,
      y: ly,
      width: lensW,
      height: lensH,
      visible: true
    });
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (!images || images.length <= 1) return;
    const nextIdx = (activeImage - 1 + images.length) % images.length;
    if (onActiveImageChange) onActiveImageChange(nextIdx);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (!images || images.length <= 1) return;
    const nextIdx = (activeImage + 1) % images.length;
    if (onActiveImageChange) onActiveImageChange(nextIdx);
  };

  const hasMultiple = images && images.length > 1;
  const displayName = product?.name || productName;

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={() => setIsModalOpen(true)}
        className={`product-zoom-viewport ${isHovering ? 'is-zoomed' : ''} ${className}`}
        role="region"
        aria-label="Product Image with Amazon Zoom"
      >
        {/* Navigation chevrons */}
        {hasMultiple && (
          <>
            <button
              type="button"
              className="product-zoom-nav-btn prev"
              onClick={handlePrev}
              title="Previous Image"
              aria-label="Previous Image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="product-zoom-nav-btn next"
              onClick={handleNext}
              title="Next Image"
              aria-label="Next Image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Top-Right Quick Enlarge Button */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-25" onClick={(e) => e.stopPropagation()}>
          {extraTopRight}
          <button
            type="button"
            className="amazon-enlarge-btn"
            onClick={() => setIsModalOpen(true)}
            title="Click to open expanded view"
            aria-label="Click to open expanded view"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Amazon Dotted Blue Mesh Lens Overlay */}
        {isHovering && lensPos.visible && !isTouchDevice && (
          <div
            className="amazon-lens"
            style={{
              left: `${lensPos.x}px`,
              top: `${lensPos.y}px`,
              width: `${lensPos.width}px`,
              height: `${lensPos.height}px`,
            }}
          />
        )}

        {/* Main Base Image Viewport (Stays clean at 1x, unblurred) */}
        <div className="product-zoom-img-wrapper">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-xs">
              <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.img
              key={activeImage}
              ref={imgRef}
              src={transformCloudinaryUrl(activeImageUrl, { width: 1200 })}
              srcSet={activeImageUrl?.includes('res.cloudinary.com') ? getCloudinarySrcSet(activeImageUrl, [640, 960, 1200, 1600]) : undefined}
              sizes="(max-width: 1024px) 100vw, 58vw"
              alt={displayName}
              onLoad={() => {
                if (setImageLoading) setImageLoading(false);
                updateSizes();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoading ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="product-zoom-image"
              fetchpriority={activeImage === 0 ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
            />
          </AnimatePresence>
        </div>

        {/* Amazon-Style Bottom Hint Badge */}
        <div className="amazon-zoom-badge">
          {isTouchDevice ? (
            <>
              <ZoomIn size={13} className="text-emerald-600" />
              <span>Tap to expand & zoom</span>
            </>
          ) : isHovering ? (
            <>
              <Maximize2 size={13} className="text-slate-800" />
              <span>Click image to open expanded view</span>
            </>
          ) : (
            <>
              <Search size={13} className="text-slate-400" />
              <span>Roll over image to zoom in</span>
            </>
          )}
        </div>

        {/* Amazon-Style Side Zoom Flyout Window (Image 3) */}
        {isHovering && lensPos.visible && !isTouchDevice && (
          <div
            className="amazon-zoom-flyout"
            style={{
              width: `${flyoutSize.width}px`,
              height: `${flyoutSize.height}px`,
            }}
          >
            <img
              src={transformCloudinaryUrl(activeImageUrl, { width: 2000 })}
              alt="Amazon Zoomed View"
              draggable={false}
              style={{
                width: `${containerSize.width * ZOOM_FACTOR}px`,
                height: `${containerSize.height * ZOOM_FACTOR}px`,
                transform: `translate(-${lensPos.x * ZOOM_FACTOR}px, -${lensPos.y * ZOOM_FACTOR}px)`,
                position: 'absolute',
                left: 0,
                top: 0,
                maxWidth: 'none',
                maxHeight: 'none',
                objectFit: 'contain',
              }}
            />
          </div>
        )}
      </div>

      {/* Amazon-Style Click Modal Inspector (Image 2) */}
      <AmazonImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={images}
        activeImage={activeImage}
        onActiveImageChange={onActiveImageChange}
        product={product}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
      />
    </>
  );
}
