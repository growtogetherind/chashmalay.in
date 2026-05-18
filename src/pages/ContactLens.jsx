import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, ShieldCheck, Zap, Droplets, Filter, ChevronDown, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ui/ProductCard';
import { FadeIn, RevealText, StaggerContainer, StaggerItem } from '../components/ui/Motion';
import { subscribeProducts } from '../lib/firebase';

const CONTACT_LENS_FILTERS = {
    disposable_type: ['Daily', 'Bi-weekly', 'Monthly', 'Yearly', 'Quarterly'],
    contact_lens_type: ['Spherical', 'Toric', 'Multifocal', 'Colored'],
    pack_size: ['1 Lens', '2 Lenses', '6 Lenses', '10 Lenses', '30 Lenses', '90 Lenses'],
    brand: ['Acuvue', 'Bausch + Lomb', 'CooperVision', 'Alcon', 'Freshlook', 'Air Optix']
};

const EMPTY_FILTERS = {
  brand: [],
  disposable_type: [],
  contact_lens_type: [],
  pack_size: []
};

const normalizeText = (value = '') => String(value)
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const isContactLensCategory = (category = '') => {
  const normalizedCategory = normalizeText(category);
  return normalizedCategory.includes('contact') || normalizedCategory === 'contacts';
};

const getCreatedSeconds = (createdAt) => {
  if (!createdAt) return 0;
  if (typeof createdAt.seconds === 'number') return createdAt.seconds;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis() / 1000;
  const parsed = Date.parse(createdAt);
  return Number.isFinite(parsed) ? parsed / 1000 : 0;
};

const getPrice = (product = {}) => Number(product.price || product.consumersPrice || 0);

const sortProducts = (products, sort) => {
  const result = [...products];
  if (sort === 'price-low') result.sort((a, b) => getPrice(a) - getPrice(b));
  else if (sort === 'price-high') result.sort((a, b) => getPrice(b) - getPrice(a));
  else if (sort === 'newest') result.sort((a, b) => getCreatedSeconds(b.created_at) - getCreatedSeconds(a.created_at));
  return result;
};

const matchesLensFilters = (product, filters) => (
  Object.keys(filters).every((key) => (
    filters[key].length === 0 || filters[key].includes(product[key])
  ))
);

const mergeOptions = (baseOptions, values) => {
  const merged = [...baseOptions];
  values.filter(Boolean).forEach((value) => {
    if (!merged.some((option) => normalizeText(option) === normalizeText(value))) {
      merged.push(value);
    }
  });
  return merged;
};

const ContactLens = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState(EMPTY_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState('recommended');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [expandedFilters, setExpandedFilters] = useState({
    brand: false,
    disposable_type: true, // Usage Duration is unfolded by default
    pack_size: false,
  });

  const toggleFilter = (key) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeProducts({ category: null }, (data) => {
      const clProducts = (data || []).filter(p => isContactLensCategory(p.category)).map(p => ({
          ...p,
          disposable_type: p.disposable_type || 'Monthly',
          contact_lens_type: p.contact_lens_type || 'Spherical',
          pack_size: p.pack_size || '6 Lenses',
          brand: p.brand || 'Generic'
      }));

      setProducts(clProducts);
      setLoading(false);
    }, () => setLoading(false));

    window.scrollTo(0, 0);
    return unsubscribe;
  }, []);

  const filteredProducts = React.useMemo(() => (
    sortProducts(products.filter((product) => matchesLensFilters(product, selectedFilters)), sortBy)
  ), [products, selectedFilters, sortBy]);

  const filterOptions = React.useMemo(() => (
    Object.keys(CONTACT_LENS_FILTERS).reduce((options, key) => ({
      ...options,
      [key]: mergeOptions(CONTACT_LENS_FILTERS[key], products.map((product) => product[key])),
    }), {})
  ), [products]);

  useEffect(() => {
    if (isMobileFilterOpen) {
      setPendingFilters(selectedFilters);
    }
  }, [isMobileFilterOpen, selectedFilters]);

  const handleFilterChange = (key, value) => {
    setPendingFilters(prev => {
        const current = prev[key];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];

        return { ...prev, [key]: updated };
    });
  };

  const handleApplyFilters = () => {
    setSelectedFilters(pendingFilters);
    setIsMobileFilterOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAll = () => {
    setPendingFilters(EMPTY_FILTERS);
    setSelectedFilters(EMPTY_FILTERS);
  };

  const getFacetedCount = (key, value) => {
    return products.filter(p => {
        const matchesOthers = Object.keys(pendingFilters).every(filterKey => {
            if (filterKey === key) return true;
            return pendingFilters[filterKey].length === 0 || pendingFilters[filterKey].includes(p[filterKey]);
        });
        return matchesOthers && p[key] === value;
    }).length;
  };

  return (
    <div className="bg-[#fbfaff] text-primary min-h-screen relative overflow-x-hidden font-sans">
      {/* Editorial Header - Matches Category.jsx */}
      <header className="pt-6 pb-4 border-b border-divider bg-white">
        <div className="container mx-auto px-4 md:px-8">
           <div className="flex flex-col md:flex-row justify-between items-baseline gap-8">
              <div className="max-w-2xl">
                <FadeIn delay={0}>
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-accent mb-2 block">
                    Collection / Precision Optics
                  </span>
                </FadeIn>
                <h1 className="text-3xl md:text-5xl leading-tight tracking-tighter text-heading break-words font-medium uppercase flex items-baseline gap-3 flex-wrap">
                  <RevealText text="Contact Lenses" delay={0.1} />
                  <span className="text-sm md:text-base font-normal text-slate-400 normal-case">
                    {filteredProducts.length} items
                  </span>
                </h1>
                <FadeIn delay={0.2}>
                  <p className="mt-4 text-body text-xs md:text-sm font-medium max-w-lg leading-relaxed opacity-70">
                    Experience crystal-clear clarity and all-day comfort with our curated collection of world-class contact lenses.
                  </p>
                </FadeIn>
              </div>
           </div>
        </div>
      </header>

      {/* Trust Badges - Matches brand aesthetic */}
      <div className="bg-white/50 backdrop-blur-sm py-4 border-b border-divider">
        <div className="container mx-auto px-8 flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                <ShieldCheck size={14} className="text-accent" />
                <span>100% Authentic</span>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                <Zap size={14} className="text-accent" />
                <span>Fast Dispatch</span>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                <Droplets size={14} className="text-accent" />
                <span>Hydration Tech</span>
            </div>
        </div>
      </div>

      <div className="w-full max-w-[1920px] mx-auto py-6 md:py-12 px-4 lg:px-8 lg:pl-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
             {/* Minimal Sidebar - Matches Category.jsx Sidebar feel */}
             <aside className="hidden lg:block lg:col-span-3">
                <FadeIn delay={0.4} className="sticky top-28 bg-white border-r border-gray-100 p-6 h-[calc(100vh-112px)] max-h-[calc(100vh-112px)] overflow-y-auto custom-scrollbar pr-6">
                   {/* Sort By Section */}
                   <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-slate-900 hover:text-primary transition-colors cursor-pointer">
                         <ArrowUpDown size={16} className="text-slate-700" />
                         <span className="text-sm md:text-base font-extrabold text-slate-900 uppercase tracking-wide">Sort By</span>
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none hover:border-slate-300 transition-all cursor-pointer min-w-[120px]"
                      >
                        <option value="recommended">Recommended</option>
                        <option value="price-low">Price Low</option>
                        <option value="price-high">Price High</option>
                        <option value="newest">Newest</option>
                      </select>
                   </div>

                   {/* Filters Header (funnel icon + bold title) */}
                   <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-gray-100">
                      <Filter className="text-slate-900" size={20} strokeWidth={2.5} />
                      <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Filters</span>
                   </div>

                   <div className="space-y-2">
                      {/* Premium Brands Accordion */}
                      <div className="border-b border-gray-100 pb-2">
                         <button
                           onClick={() => toggleFilter('brand')}
                           className="w-full flex justify-between items-center py-4 text-left focus:outline-none group"
                         >
                           <span className="text-base md:text-lg font-extrabold text-slate-900 group-hover:text-primary transition-colors">Premium Brands</span>
                           <ChevronDown
                             size={18}
                             className={`text-slate-500 transition-transform duration-300 ${expandedFilters.brand ? 'transform rotate-180 text-primary' : ''}`}
                           />
                         </button>
                         <AnimatePresence initial={false}>
                           {expandedFilters.brand && (
                             <motion.div
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               transition={{ duration: 0.25, ease: 'easeInOut' }}
                               className="overflow-hidden"
                             >
                               <div className="pt-2 pb-4">
                                 <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                     {filterOptions.brand.map(brand => {
                                         const isSelected = pendingFilters.brand.includes(brand);
                                         const count = getFacetedCount('brand', brand);
                                         return (
                                             <button
                                                 key={brand}
                                                 onClick={() => handleFilterChange('brand', brand)}
                                                 disabled={count === 0 && !isSelected}
                                                 className={`flex items-center justify-between w-full group transition-all p-2.5 rounded-xl hover:bg-slate-50 ${
                                                     isSelected ? 'bg-slate-50 text-primary font-bold' : 'text-slate-500 hover:text-primary'
                                                 } ${count === 0 && !isSelected ? 'opacity-20 cursor-not-allowed' : ''}`}
                                             >
                                                 <div className="flex items-center gap-3">
                                                     <div className={`w-1.5 h-1.5 rounded-full transition-all ${isSelected ? 'bg-primary' : 'bg-transparent border border-slate-300'}`} />
                                                     <span className={`text-xs font-bold tracking-wide ${isSelected ? 'text-primary' : ''}`}>{brand}</span>
                                                 </div>
                                                 <span className="text-[10px] font-mono font-bold opacity-40">({count})</span>
                                             </button>
                                         );
                                     })}
                                 </div>
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>

                      {/* Usage Duration Accordion */}
                      <div className="border-b border-gray-100 pb-2">
                         <button
                           onClick={() => toggleFilter('disposable_type')}
                           className="w-full flex justify-between items-center py-4 text-left focus:outline-none group"
                         >
                           <span className="text-base md:text-lg font-extrabold text-slate-900 group-hover:text-primary transition-colors">Usage Duration</span>
                           <ChevronDown
                             size={18}
                             className={`text-slate-500 transition-transform duration-300 ${expandedFilters.disposable_type ? 'transform rotate-180 text-primary' : ''}`}
                           />
                         </button>
                         <AnimatePresence initial={false}>
                           {expandedFilters.disposable_type && (
                             <motion.div
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               transition={{ duration: 0.25, ease: 'easeInOut' }}
                               className="overflow-hidden"
                             >
                               <div className="pt-2 pb-4">
                                 <div className="grid grid-cols-2 gap-3">
                                     {filterOptions.disposable_type.map(type => {
                                         const isSelected = pendingFilters.disposable_type.includes(type);
                                         const count = getFacetedCount('disposable_type', type);
                                         return (
                                             <button
                                                 key={type}
                                                 onClick={() => handleFilterChange('disposable_type', type)}
                                                 className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all duration-300 group shadow-sm ${
                                                     isSelected ? 'border-primary bg-primary text-white scale-[1.03] shadow-lg shadow-primary/10' : 'border-slate-200 hover:border-primary/20 text-slate-500 hover:text-primary hover:bg-slate-50'
                                                 } ${count === 0 && !isSelected ? 'opacity-10 grayscale cursor-not-allowed' : ''}`}
                                             >
                                                 <span className="text-[10px] font-black uppercase tracking-wider leading-none text-center">{type}</span>
                                                 <span className={`text-[8px] mt-1 font-mono font-bold ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>({count})</span>
                                             </button>
                                         );
                                     })}
                                 </div>
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>

                      {/* Pack Size Accordion */}
                      <div className="border-b border-gray-100 pb-2">
                         <button
                           onClick={() => toggleFilter('pack_size')}
                           className="w-full flex justify-between items-center py-4 text-left focus:outline-none group"
                         >
                           <span className="text-base md:text-lg font-extrabold text-slate-900 group-hover:text-primary transition-colors">Pack Size</span>
                           <ChevronDown
                             size={18}
                             className={`text-slate-500 transition-transform duration-300 ${expandedFilters.pack_size ? 'transform rotate-180 text-primary' : ''}`}
                           />
                         </button>
                         <AnimatePresence initial={false}>
                           {expandedFilters.pack_size && (
                             <motion.div
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               transition={{ duration: 0.25, ease: 'easeInOut' }}
                               className="overflow-hidden"
                             >
                               <div className="pt-2 pb-4">
                                 <div className="grid grid-cols-2 gap-2">
                                     {filterOptions.pack_size.map(size => {
                                         const isSelected = pendingFilters.pack_size.includes(size);
                                         const count = getFacetedCount('pack_size', size);
                                         return (
                                             <button
                                                 key={size}
                                                 onClick={() => handleFilterChange('pack_size', size)}
                                                 className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-center ${
                                                     isSelected ? 'bg-primary text-white border-primary shadow-md shadow-primary/10' : 'border-slate-200 text-slate-500 hover:border-primary/30 hover:text-primary hover:bg-slate-50'
                                                 } ${count === 0 && !isSelected ? 'opacity-10 cursor-not-allowed' : ''}`}
                                             >
                                                 {size} ({count})
                                             </button>
                                         );
                                     })}
                                 </div>
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                      </div>
                   </div>

                   {/* Mockup Lavender Apply Button */}
                   <button
                     onClick={handleApplyFilters}
                     className="w-full mt-6 py-4 bg-[#8e90af] hover:bg-[#7e809e] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#8e90af]/20 hover:scale-[1.02] active:scale-[0.98] text-sm tracking-wider"
                   >
                     Apply
                   </button>
                </FadeIn>
             </aside>

             {/* Results Grid */}
             <main className="lg:col-span-9">
                {loading ? (
                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-8">
                      {[...Array(6)].map((_, i) => (
                         <div key={i} className="aspect-[3/4] bg-slate-50 rounded-2xl animate-pulse" />
                      ))}
                   </div>
                ) : filteredProducts.length > 0 ? (
                   <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-8">
                      {filteredProducts.map((product) => (
                         <StaggerItem key={product.id}>
                            <ProductCard product={product} />
                         </StaggerItem>
                      ))}
                   </StaggerContainer>
                ) : (
                   <FadeIn className="flex flex-col items-center justify-center py-32 text-center">
                       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                         <X size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-primary mb-2">No Matching Lenses</h3>
                       <p className="text-slate-400 text-sm max-w-xs">We couldn’t find any lenses matching your current filters.</p>
                       <button
                         onClick={handleClearAll}
                         className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-accent border-b border-accent/30 pb-1 hover:border-accent transition-all"
                       >
                         Reset All Filters
                       </button>
                   </FadeIn>
                )}
             </main>
         </div>
      </div>

      {/* Mobile Filter Trigger */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] lg:hidden">
         <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-4 bg-[#0F172A] text-white px-8 py-5 rounded-full shadow-2xl shadow-indigo-900/40"
         >
            <SlidersHorizontal size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Filter Lenses</span>
            <div className="w-6 h-6 bg-amber-500 rounded-full text-[10px] flex items-center justify-center text-[#0F172A] font-bold">
                {Object.values(pendingFilters).flat().length}
            </div>
         </motion.button>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsMobileFilterOpen(false)}
               className="fixed inset-0 bg-black/40 backdrop-blur-md z-[2000]"
            />
            <motion.div
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-[40px] z-[2001] p-8 overflow-y-auto shadow-2xl"
            >
               <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0F172A]">Filter Options</h3>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <X size={20} />
                  </button>
               </div>

               <div className="space-y-12 pb-24">
                  {/* Reuse filter logic here for mobile */}
                  {Object.entries(filterOptions).map(([key, options]) => (
                    <div key={key}>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-3">
                            <div className="w-1 h-3 bg-amber-400"></div>
                            {key.replace('_', ' ')}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {options.map(opt => {
                                const isSelected = pendingFilters[key].includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => handleFilterChange(key, opt)}
                                        className={`p-4 rounded-2xl border-2 text-[10px] font-bold uppercase transition-all ${
                                            isSelected ? 'bg-[#0F172A] border-[#0F172A] text-white' : 'bg-gray-50 border-gray-50 text-gray-500'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                  ))}
               </div>

               <div className="fixed bottom-8 left-8 right-8">
                    <button
                        onClick={handleApplyFilters}
                        className="w-full bg-[#CA8A04] text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20"
                    >
                        Apply Filters ({filteredProducts.length})
                    </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactLens;
