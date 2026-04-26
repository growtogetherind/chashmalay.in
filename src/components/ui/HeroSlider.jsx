import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Music, Phone, Navigation, Disc } from 'lucide-react';
import './HeroSlider.css';
import { getCarouselItems } from '../../lib/firebase';

const HeroSlider = () => {
  const [slides, setSlides] = React.useState([]);
  const [current, setCurrent] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSlides = async () => {
      const { data } = await getCarouselItems();
      if (data && data.length > 0) {
        setSlides(data.filter(s => s.is_active));
      } else {
        // Fallback slides with new posters
        setSlides([
          {
            id: 'f1',
            title: 'NEW ARRIVALS 2026',
            subtitle: 'EXPLORE THE FUTURE OF VISION',
            price: 'Starting ₹2499',
            features: ['Premium', 'Lightweight', 'Anti-Glare'],
            image: '/assets/im/all_img/WEBSITE_BANNER_1.jpg.jpeg',
            theme: 'dark'
          },
          {
            id: 'f2',
            title: 'TITAN ELITE COLLECTION',
            subtitle: 'ENGINEERED FOR PRECISION',
            price: 'Flat 20% OFF',
            features: ['Titanium', 'Durable', 'Sapphire Lens'],
            image: '/assets/im/all_img/26march-website-banner.jpg.jpeg',
            theme: 'light'
          },
          {
             id: 'f3',
             title: 'LUXURY RETRO',
             subtitle: 'VINTAGE REIMAGINED',
             price: 'Exclusive Edition',
             features: ['Gold Plated', 'Handmade', 'Limited'],
             image: '/assets/im/poster1.png',
             theme: 'dark'
          }
        ]);
      }
      setLoading(false);
    };
    fetchSlides();
  }, []);

  const next = React.useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = React.useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  React.useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        next();
      }, 4000); // Changed to 4 seconds for a quicker feel
      return () => clearInterval(timer);
    }
  }, [slides.length, next]);

  if (loading || slides.length === 0) return (
    <div className="h-[80vh] bg-surface-flat flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const currentSlide = slides[current];
  const isLight = currentSlide.theme === 'light';

  return (
    <section className="hero-viewport relative h-[80vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
           key={currentSlide.id}
           className="hero-slide-item relative w-full h-full"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 1 }}
        >
          {/* Background Image - Now Full Fit without overlay text */}
          <div className="absolute inset-0">
             <picture>
                {currentSlide.mobile_image && (
                   <source media="(max-width: 768px)" srcSet={currentSlide.mobile_image} />
                )}
                <img src={currentSlide.image} alt="Hero" className="w-full h-full object-cover" />
             </picture>
             {/* Gradient overlay for navigation visibility */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Navigation Controls only */}
          <div className="absolute inset-x-0 bottom-10 container flex justify-center gap-4 z-20">
             {slides.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${current === i ? 'bg-[#009688] w-8' : isLight ? 'bg-black/20' : 'bg-white/40'}`} 
                />
             ))}
          </div>
          
          <button onClick={prev} className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center hover:bg-[#009688] hover:text-white z-20 transition-all ${isLight ? 'bg-black/10 text-black' : 'bg-white/10 text-white'}`}>
             <ChevronLeft />
          </button>
          <button onClick={next} className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center hover:bg-[#009688] hover:text-white z-20 transition-all ${isLight ? 'bg-black/10 text-black' : 'bg-white/10 text-white'}`}>
             <ChevronRight />
          </button>
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default HeroSlider;
