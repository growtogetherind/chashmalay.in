import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscribeCarouselItems, subscribeSettings } from '../../lib/firebase';

const FALLBACK_SLIDES = [
  {
    id: 'f1',
    title: 'Classic Square',
    titleLine2: 'Sunglasses',
    titleLine3: 'Female',
    subtitle: 'Vintage Brand Design',
    badge: 'New Collection',
    cta: 'Shop Now',
    ctaLink: '/category/sunglasses',
    image: '/assets/im/all_img/WEBSITE_BANNER_1.jpg.jpeg',
    bg: '#cc0000',
  },
  {
    id: 'f2',
    title: 'Titan Elite',
    titleLine2: 'Collection',
    titleLine3: '',
    subtitle: 'Engineered for Precision',
    badge: 'Flat 20% OFF',
    cta: 'Explore Now',
    ctaLink: '/category/eyeglasses',
    image: '/assets/im/all_img/26march-website-banner.jpg.jpeg',
    bg: '#111111',
  },
];

const HeroSlider = () => {
  const [slides, setSlides] = React.useState([]);
  const [current, setCurrent] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [settings, setSettings] = React.useState({});

  React.useEffect(() => {
    const unsubSettings = subscribeSettings(setSettings);
    const unsubscribe = subscribeCarouselItems((data) => {
      if (data && data.length > 0) {
        const active = data.filter(s => s.is_active);
        setSlides(active.length > 0 ? active : FALLBACK_SLIDES);
      } else {
        setSlides(FALLBACK_SLIDES);
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, []);

  const next = React.useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = React.useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  React.useEffect(() => {
    if (slides.length > 0) {
      const interval = settings.carousel_interval ? settings.carousel_interval * 1000 : 5000;
      const timer = setInterval(next, interval);
      return () => clearInterval(timer);
    }
  }, [slides.length, next, settings.carousel_interval]);

  if (loading) return (
    <div className="h-64 bg-gray-100 flex items-center justify-center mx-3 my-3 rounded-2xl">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const slide = slides[current];

  return (
    <div className="w-full bg-white px-3 sm:px-5 md:px-8 py-4 space-y-3 sm:space-y-4">

      {/* ═══════════════════════════════════════
          HERO BANNER — red rounded card
      ═══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
        style={{ background: slide.bg || '#cc0000', minHeight: 'clamp(200px, 35vw, 380px)' }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={slide.id}
            className="relative flex items-center h-full"
            style={{ minHeight: 'clamp(200px, 35vw, 380px)' }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* ── Left: Text Content ── */}
            <div className="relative z-10 flex-1 px-6 py-8 sm:px-10 sm:py-10 md:px-14 md:py-12 max-w-[58%] sm:max-w-[55%]">
              {slide.badge && (
                <span className="inline-block text-[10px] sm:text-xs font-bold text-white/70 uppercase tracking-[0.2em] mb-3 sm:mb-4 bg-white/15 px-2.5 py-1 rounded-full">
                  {slide.badge}
                </span>
              )}

              <h1
                className="text-white font-black leading-[0.95] mb-1"
                style={{ fontSize: 'clamp(1.5rem, 4.5vw, 3.75rem)' }}
              >
                {slide.title || 'Classic Square'}
              </h1>

              {slide.titleLine2 && (
                <h1
                  className="text-white font-black leading-[0.95] mb-1"
                  style={{ fontSize: 'clamp(1.5rem, 4.5vw, 3.75rem)' }}
                >
                  {slide.titleLine2}
                </h1>
              )}

              {slide.titleLine3 ? (
                <div className="flex items-end gap-2 sm:gap-4 flex-wrap mt-1">
                  <h1
                    className="text-white font-black leading-[0.95]"
                    style={{ fontSize: 'clamp(1.5rem, 4.5vw, 3.75rem)' }}
                  >
                    {slide.titleLine3}
                  </h1>
                  {slide.subtitle && (
                    <span className="text-white/75 text-[11px] sm:text-sm font-medium leading-snug mb-1">
                      {slide.subtitle.split(' ').slice(0, 1).join(' ')}<br />
                      {slide.subtitle.split(' ').slice(1).join(' ')}
                    </span>
                  )}
                </div>
              ) : slide.subtitle ? (
                <p className="text-white/75 text-xs sm:text-sm font-medium mt-2">{slide.subtitle}</p>
              ) : null}

              {slide.cta && (
                <Link
                  to={slide.ctaLink || '/category/all'}
                  className="mt-5 sm:mt-7 inline-flex items-center gap-2 bg-white text-red-600 font-bold text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
                >
                  {slide.cta}
                </Link>
              )}
            </div>

            {/* ── Right: Model photo with fade mask ── */}
            <div className="absolute right-0 top-0 h-full w-[55%] sm:w-1/2 pointer-events-none">
              <img
                src={slide.image}
                alt={slide.title || 'Hero'}
                className="h-full w-full object-cover object-top"
                loading="eager"
                style={{
                  maskImage: 'linear-gradient(to left, black 55%, transparent 95%)',
                  WebkitMaskImage: 'linear-gradient(to left, black 55%, transparent 95%)',
                }}
              />
            </div>

            {/* Arrows */}
            <button
              onClick={prev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white z-20 transition-colors backdrop-blur-sm"
              aria-label="Previous"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white z-20 transition-colors backdrop-blur-sm"
              aria-label="Next"
            >
              <ChevronRight size={15} />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${current === i ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          BENTO GRID — below the hero banner
      ═══════════════════════════════════════ */}

      {/* Mobile: stacked, Tablet+: 2-column bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_2fr] gap-3 sm:gap-4">

        {/* ─ Cell A: Tall photo (spans rows on lg) ─ */}
        <div className="sm:row-span-2 relative overflow-hidden rounded-xl sm:rounded-2xl bg-gray-900 h-48 sm:h-auto sm:min-h-[300px]">
          <img
            src="/assets/im/all_img/WEBSITE_BANNER_1.jpg.jpeg"
            alt="Fashion Style"
            className="absolute inset-0 w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
          />
          {/* Bottom red gradient accent */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-red-800/70 via-red-700/20 to-transparent" />
        </div>

        {/* ─ Cell B: Red promo card ─ */}
        <Link
          to="/category/sunglasses"
          className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-red-600 flex items-center h-36 sm:h-44 md:h-48"
        >
          {/* Text */}
          <div className="flex-1 px-5 sm:px-7 py-5 z-10 min-w-0">
            <h3 className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-tight mb-1">
              SUNGLASSES
            </h3>
            <p className="text-white/80 text-sm leading-snug">That Define Your</p>
            <p className="text-white italic font-semibold text-sm leading-snug">Unique Style</p>
          </div>
          {/* Model image — right half */}
          <div className="relative h-full w-2/5 flex-shrink-0 overflow-hidden">
            <img
              src="/assets/im/all_img/WEBSITE_BANNER_1.jpg.jpeg"
              alt="Sunglasses Model"
              className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
              }}
            />
          </div>
        </Link>

        {/* ─ Cells C & D: Two dark photo cards ─ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gray-900 h-32 sm:h-40 md:h-44">
            <img
              src="/assets/im/all_img/26march-website-banner.jpg.jpeg"
              alt="Collection Style"
              className="absolute inset-0 w-full h-full object-cover brightness-75 hover:brightness-95 hover:scale-105 transition-all duration-400"
            />
          </div>
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gray-800 h-32 sm:h-40 md:h-44">
            <img
              src="/assets/im/poster1.png"
              alt="Eyewear Style"
              className="absolute inset-0 w-full h-full object-cover brightness-75 hover:brightness-95 hover:scale-105 transition-all duration-400"
              onError={(e) => { e.target.src = '/assets/im/eyeglasses.png'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
