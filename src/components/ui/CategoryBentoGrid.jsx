import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { subscribeCategories } from '../../lib/firebase';

const MOCKUP_CATEGORIES = [
  {
    id: 'eyewear',
    name: 'Eyewear',
    image: 'https://i.ibb.co/dsJrhRr1/eyewear-optimized.webp',
    link: '/category/eyeglasses',
    color: '#F6F4EE',
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    image: 'https://i.ibb.co/dsJrhRr1/eyewear-optimized.webp',
    link: '/category/sunglasses',
    color: '#FFE5D0',
  },
  {
    id: 'clip-on-glasses',
    name: 'Clip-On Glasses',
    image: 'https://i.ibb.co/vvsT2Csx/clip-on-optimized.webp',
    link: '/category/clip-on-glasses',
    color: '#EED9F7',
  },
  {
    id: 'contact-lenses',
    name: 'Contact Lenses',
    image: 'https://i.ibb.co/Y4xPqzYN/lenses-optimized.webp',
    link: '/contact-lenses',
    color: '#D2F3E1',
  },
  {
    id: 'reading-glasses',
    name: 'Reading Glasses',
    image: 'https://i.ibb.co/GfVs075q/reder-glasses-optimized.webp',
    link: '/category/reading-glasses',
    color: '#D7ECFB',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    image: 'https://i.ibb.co/rKBPK5bY/acces-optimized.webp',
    link: '/category/accessories',
    color: '#EFE8D3',
  },
];

const FALLBACK_COLORS = ['#F6F4EE', '#FFE5D0', '#EED9F7', '#D2F3E1', '#D7ECFB', '#EFE8D3', '#F3E8FF', '#FCE7F3'];

const CategoryBentoGrid = () => {
  const [liveCategories, setLiveCategories] = React.useState([]);

  React.useEffect(() => {
    const unsubscribe = subscribeCategories((data) => setLiveCategories(data || []));
    return unsubscribe;
  }, []);

  const activeLive = liveCategories.filter((cat) => cat.is_active !== false);

  // Use live categories from admin when present; fallback to mockup if empty
  const sourceList = activeLive.length > 0 ? activeLive : MOCKUP_CATEGORIES;

  const categories = sourceList.map((cat, idx) => {
    let link = cat.link;
    if (!link) {
      const slug = cat.slug || cat.name?.toLowerCase().trim().replace(/&/g, 'and').replace(/\s+/g, '-');
      if (slug === 'contacts' || slug === 'contact-lenses') {
        link = '/contact-lenses';
      } else {
        link = `/category/${slug}`;
      }
    }

    const color = (cat.color && cat.color !== '#f8fafc' && cat.color !== '#ffffff')
      ? cat.color
      : FALLBACK_COLORS[idx % FALLBACK_COLORS.length];

    const image = cat.image_url || cat.image || cat.base_photo || cat.basePhoto || cat.photo || 'https://i.ibb.co/dsJrhRr1/eyewear-optimized.webp';

    return {
      id: cat.id || `cat-${idx}`,
      name: cat.name,
      image,
      link,
      color,
    };
  });

  return (
    <section className="py-10 md:py-14">
      {/* Header */}
      <div className="text-center mb-8 md:mb-10 relative">
        <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.2em] text-gray-900">
          Shop by Category
        </h2>
        <Link
          to="/category/all"
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline absolute right-0 top-1/2 -translate-y-1/2"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>

      {/* Category Cards — horizontal scroll on mobile, responsive grid on desktop */}
      <div 
        className="flex overflow-x-auto pb-4 md:pb-0 gap-4 md:grid md:gap-6 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        style={{
          gridTemplateColumns: categories.length <= 6
            ? `repeat(${categories.length}, minmax(0, 1fr))`
            : 'repeat(auto-fit, minmax(150px, 1fr))'
        }}
      >
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 w-[28%] sm:w-[20%] md:w-auto snap-start"
          >
            <Link to={cat.link} className="group flex flex-col gap-3 focus-visible:outline-none">
              {/* Squircle image */}
              <div
                className="relative w-full aspect-square rounded-[24px] sm:rounded-[32px] overflow-hidden flex items-center justify-center transition-all duration-300"
                style={{ background: cat.color }}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Label */}
              <div className="text-center">
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-primary transition-colors leading-tight">
                  {cat.name}
                </h3>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Mobile "View All" */}
      <div className="flex justify-center mt-8 sm:hidden">
        <Link
          to="/category/all"
          className="flex items-center gap-1.5 text-sm font-semibold text-primary border border-blue-200 px-5 py-2 rounded-full hover:bg-blue-50 transition-colors"
        >
          View All Categories <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
};

export default CategoryBentoGrid;
