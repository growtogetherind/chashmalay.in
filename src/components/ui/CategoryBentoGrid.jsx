import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { subscribeCategories } from '../../lib/firebase';

const FALLBACK_CATEGORIES = [
  {
    id: 'eyeglasses',
    name: 'Eyeglasses',
    count: '2000+ Styles',
    image: '/assets/im/eyeglasses1.png',
    link: '/category/eyeglasses',
    color: '#f8f4f0',
    accent: '#b45309',
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    count: '1500+ Styles',
    image: '/assets/im/sunglasses.png',
    link: '/category/sunglasses',
    color: '#f0f4f8',
    accent: '#1d4ed8',
  },
  {
    id: 'contact-lenses',
    name: 'Contact Lenses',
    count: 'All Powers',
    image: '/assets/im/lens.png',
    link: '/category/contacts',
    color: '#f0faf4',
    accent: '#15803d',
  },
];

const CategoryBentoGrid = () => {
  const [liveCategories, setLiveCategories] = React.useState([]);

  React.useEffect(() => {
    const unsubscribe = subscribeCategories((data) => setLiveCategories(data || []));
    return unsubscribe;
  }, []);

  const categories = liveCategories.length > 0
    ? liveCategories.slice(0, 3).map((cat, index) => ({
        id: cat.id,
        name: cat.name,
        count: cat.description || 'Shop styles',
        image: cat.image || FALLBACK_CATEGORIES[index % FALLBACK_CATEGORIES.length].image,
        link: `/category/${cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-')}`,
        color: cat.color || FALLBACK_CATEGORIES[index % FALLBACK_CATEGORIES.length].color,
        accent: cat.accent || FALLBACK_CATEGORIES[index % FALLBACK_CATEGORIES.length].accent,
      }))
    : FALLBACK_CATEGORIES;

  return (
    <section className="py-10 md:py-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-1.5">Browse by type</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">Shop by Category</h2>
        </div>
        <Link
          to="/category/all"
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>

      {/* Category Cards — always 3 in a row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-5 md:gap-6">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link to={cat.link} className="group flex flex-col items-center gap-3 sm:gap-4 focus-visible:outline-none">
              {/* Circle image */}
              <div
                className="relative w-full aspect-square rounded-full overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-red-400 group-hover:shadow-lg transition-all duration-300"
                style={{ background: cat.color }}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                {/* Subtle inner shadow ring on hover */}
                <div className="absolute inset-0 rounded-full ring-0 group-hover:ring-2 group-hover:ring-red-300/50 transition-all duration-300" />
              </div>

              {/* Label */}
              <div className="text-center">
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 group-hover:text-red-600 transition-colors leading-tight mb-0.5">
                  {cat.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-medium">
                  {cat.count}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Mobile "View All" */}
      <div className="flex justify-center mt-8 sm:hidden">
        <Link
          to="/category/all"
          className="flex items-center gap-1.5 text-sm font-semibold text-red-600 border border-red-200 px-5 py-2 rounded-full hover:bg-red-50 transition-colors"
        >
          View All Categories <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
};

export default CategoryBentoGrid;
