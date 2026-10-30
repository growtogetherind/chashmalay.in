import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscribeCarouselItems, subscribeSettings } from '../../lib/firebase';

const getOptimizedBannerUrl = (url, width = 2400) => {
  if (!url || typeof url !== 'string') return url || '';
  if (!url.includes('cloudinary.com')) return url;
  // Upgrade any w_800 or downscaled Cloudinary transform to ultra-crisp w_2400 with q_auto:best
  return url.replace(/\/upload\/(?:[^/]+\/)?(?=v\d|\/)/, `/upload/f_auto,q_auto:best,w_${width}/`);
};

const FALLBACK_SLIDES = [
  {
    id: 'f1',
    title: 'Ferrari Collection',
    link: '/category/eyeglasses',
    image: '/assets/im/all_img/26march-website-banner.jpg.webp',
  },
  {
    id: 'f2',
    title: 'End of Season Sale',
    link: '/category/sunglasses',
    image: '/assets/im/all_img/WEBSITE_BANNER_1.jpg.webp',
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
    }, (err) => {
      console.warn("Carousel subscription failed, falling back to local slides:", err);
      setSlides(FALLBACK_SLIDES);
      setLoading(false);
    });
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

  if (loading || !slides || slides.length === 0 || !slides[current]) return (
    <div className="h-64 bg-gray-100 flex items-center justify-center mx-3 my-3 rounded-2xl">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const slide = slides[current] || FALLBACK_SLIDES[0];

  return (
    <div className="w-full bg-white px-3 sm:px-5 md:px-8 py-4 space-y-3 sm:space-y-4 max-w-[1440px] mx-auto">

      {/* ═══════════════════════════════════════
          HERO BANNER — Sleek Balanced Proportion (1920x800 / 2.4:1 Ratio)
      ═══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-md w-full bg-slate-900 aspect-[2.4/1] max-h-[440px] sm:max-h-[480px] md:max-h-[500px] mx-auto"
        style={{ aspectRatio: '1920 / 800' }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={slide.id}
            className="relative w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link to={slide.link || slide.ctaLink || '/category/all'} className="block w-full h-full">
              <picture className="block w-full h-full">
                {slide.mobile_image && (
                  <source media="(max-width: 640px)" srcSet={getOptimizedBannerUrl(slide.mobile_image, 1200)} />
                )}
                <img
                  src={getOptimizedBannerUrl(slide.image, 2400)}
                  alt={slide.title || 'Hero Banner'}
                  className="w-full h-full object-cover object-[center_20%] sm:object-center"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </picture>
            </Link>

            {/* Arrows */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white z-20 transition-all backdrop-blur-sm shadow-lg hover:scale-105"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white z-20 transition-all backdrop-blur-sm shadow-lg hover:scale-105"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${current === i ? 'bg-white w-6 shadow-md' : 'bg-white/50 w-1.5'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          BENTO GRID — below the hero banner
      ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_2fr] gap-3 sm:gap-4">

        {/* ─ Cell A: Tall photo (spans rows on lg) ─ */}
        <div className="sm:row-span-2 relative overflow-hidden rounded-xl sm:rounded-2xl bg-gray-900 h-48 sm:h-auto sm:min-h-[300px]">
          <img
            src="/assets/im/all_img/WEBSITE_BANNER_1.jpg.webp"
            alt="Fashion Style"
            className="absolute inset-0 w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* ─ Cell B: Promo banner card without color overlays ─ */}
        <Link
          to="/category/sunglasses"
          className="group relative overflow-hidden rounded-xl sm:rounded-2xl flex items-center h-36 sm:h-44 md:h-48 border border-slate-200/50 shadow-md"
        >
          <img
            src="/assets/im/all_img/WEBSITE_BANNER_1.jpg.webp"
            alt="Sunglasses Promo"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* ─ Cells C & D: Two clean photo cards ─ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gray-900 h-32 sm:h-40 md:h-44">
            <img
              src="/assets/im/all_img/26march-website-banner.jpg.webp"
              alt="Collection Style"
              className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-all duration-400"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gray-800 h-32 sm:h-40 md:h-44">
            <img
              src="/assets/im/poster1.webp"
              alt="Eyewear Style"
              className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-all duration-400"
              loading="lazy"
              decoding="async"
              onError={(e) => { e.target.src = '/assets/im/eyeglasses.webp'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
