import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  Move,
  RefreshCcw
} from 'lucide-react';
import { transformCloudinaryUrl } from '../../lib/cloudinary';

export default function ImageZoomModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  images = [], 
  initialIndex = 0,
  title = 'Product Image Inspector'
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  // Sync initial index or URL when modal opens
  useEffect(() => {
    if (isOpen) {
      if (images && images.length > 0) {
        const foundIdx = images.indexOf(imageUrl);
        setCurrentIndex(foundIdx !== -1 ? foundIdx : initialIndex);
      }
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl, images, initialIndex]);

  const activeImage = (images && images.length > 0) 
    ? (images[currentIndex] || imageUrl) 
    : imageUrl;

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Carousel navigation
  const handlePrev = useCallback(() => {
    if (!images || images.length <= 1) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    handleReset();
  }, [images, handleReset]);

  const handleNext = useCallback(() => {
    if (!images || images.length <= 1) return;
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    handleReset();
  }, [images, handleReset]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Double click to toggle 1x / 2.5x
  const handleDoubleClick = (e) => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2.5);
    }
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan & pinch-to-zoom
  const touchStartRef = useRef(null);
  const pinchDistRef = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
        startX: touch.clientX,
        startY: touch.clientY
      };
      if (scale > 1) {
        setIsDragging(true);
      }
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchDistRef.current = { dist, initialScale: scale };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      if (scale > 1) {
        e.preventDefault();
        const touch = e.touches[0];
        setPosition({
          x: touch.clientX - touchStartRef.current.x,
          y: touch.clientY - touchStartRef.current.y
        });
      }
    } else if (e.touches.length === 2 && pinchDistRef.current) {
      e.preventDefault();
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = newDist / pinchDistRef.current.dist;
      const targetScale = Math.min(Math.max(pinchDistRef.current.initialScale * ratio, 1), 4);
      setScale(targetScale);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      if (scale <= 1 && touchStartRef.current && hasMultiple) {
        const deltaX = (e.changedTouches?.[0]?.clientX || 0) - touchStartRef.current.startX;
        if (deltaX > 60) handlePrev();
        else if (deltaX < -60) handleNext();
      }
      setIsDragging(false);
      touchStartRef.current = null;
      pinchDistRef.current = null;
    } else if (e.touches.length === 1) {
      pinchDistRef.current = null;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === '+' || e.key === '=') handleZoomIn();
      else if (e.key === '-') handleZoomOut();
      else if (e.key === 'r' || e.key === '0') handleReset();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleReset, handlePrev, handleNext]);

  if (!isOpen || !activeImage) return null;

  const hasMultiple = images && images.length > 1;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col bg-slate-900/60 backdrop-blur-xs animate-in fade-in select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/95 backdrop-blur-md text-slate-800 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <ZoomIn size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900">{title}</h3>
            {hasMultiple && (
              <p className="text-[11px] text-slate-500 font-medium">
                Photo {currentIndex + 1} of {images.length}
              </p>
            )}
          </div>
        </div>

        {/* Floating Zoom & Inspector Controls in Top Bar */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 p-1.5 rounded-2xl shadow-xs">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-xl hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 transition-all"
            title="Zoom Out (-)"
          >
            <ZoomOut size={16} />
          </button>

          <span className="px-2.5 text-xs font-mono font-bold text-slate-800 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="p-2 rounded-xl hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 transition-all"
            title="Zoom In (+)"
          >
            <ZoomIn size={16} />
          </button>

          <div className="w-[1px] h-5 bg-slate-200 mx-1" />

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl hover:bg-white hover:shadow-xs text-slate-700 transition-all"
            title="Reset Zoom & Pan (R)"
          >
            <RefreshCcw size={16} />
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all hover:scale-105 border border-slate-200"
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Zoomable Viewport */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 relative overflow-hidden flex items-center justify-center p-6 touch-none bg-slate-50/70 ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
      >
        <div 
          className="relative max-w-full max-h-full transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          <img
            src={transformCloudinaryUrl(activeImage, { width: 1800 })}
            alt="Product Zoom"
            draggable={false}
            className="max-h-[80vh] max-w-[85vw] object-contain drop-shadow-md rounded-xl pointer-events-none select-none"
          />
        </div>

        {/* Carousel Prev/Next Buttons */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-md transition-all hover:scale-110 z-10"
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-md transition-all hover:scale-110 z-10"
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Helper Instructions Pill */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-600 text-[11px] font-medium px-4 py-2 rounded-full shadow-md pointer-events-none flex items-center gap-3">
          <span>Scroll wheel / +/- to zoom</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span>Double-click to expand</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span>Click & drag to pan</span>
        </div>
      </div>

      {/* Bottom Thumbnail Strip (if multiple photos) */}
      {hasMultiple && (
        <div className="px-6 py-3 bg-white/95 border-t border-slate-200 backdrop-blur-md flex items-center justify-center gap-3 overflow-x-auto z-20">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                handleReset();
              }}
              className={`w-14 h-14 rounded-xl overflow-hidden p-1 bg-white border transition-all shrink-0 ${
                idx === currentIndex 
                  ? 'border-slate-900 ring-2 ring-slate-900/20 scale-105 shadow-sm' 
                  : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
