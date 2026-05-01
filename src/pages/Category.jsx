import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ui/ProductCard';
import { FadeIn, RevealText, StaggerContainer, StaggerItem, TRANSITIONS } from '../components/ui/Motion';

import { getProducts } from '../lib/firebase';

const FrameIcons = {
    // Shapes
    Round: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="30" cy="20" r="15"/><circle cx="70" cy="20" r="15"/><path d="M45 20h10"/></svg>,
    Square: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="15" y="10" width="30" height="20" rx="2"/><rect x="55" y="10" width="30" height="20" rx="2"/><path d="M45 20h10"/></svg>,
    Rectangle: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="10" y="12" width="35" height="16" rx="1"/><rect x="55" y="12" width="35" height="16" rx="1"/><path d="M45 20h10"/></svg>,
    'Cat Eye': () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 20c0-8 15-12 30-5 0 0 5 0 5 0s5 0 5 0c15-7 30-3 30 5-5 8-15 10-30 5 0 0-5 0-5 0s-5 0-5 0c-15 5-25 3-30-5z"/><path d="M45 20h10"/></svg>,
    Aviator: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 10c15 0 25 15 25 22 0 5-10 8-25 0-15-8-15-22 0-22zM85 10c-15 0-25 15-25 22 0 5 10 8 25 0 15-8 15-22 0-22z"/><path d="M40 15h20M40 22h20"/></svg>,
    Geometric: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 20l10-10h20l10 10-10 10h-20zM90 20l-10-10h-20l-10 10 10 10h20z"/><path d="M40 20h20"/></svg>,
    
    // Types
    'Full Rim': () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="30" cy="20" r="14"/><circle cx="70" cy="20" r="14"/><path d="M44 20h12"/></svg>,
    'Rimless': () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"><circle cx="30" cy="20" r="14"/><circle cx="70" cy="20" r="14"/><path d="M44 20h12" strokeDasharray="0"/></svg>,
    'Half Rim': () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 20a14 14 0 0 1 28 0M56 20a14 14 0 0 1 28 0"/><path d="M44 20h12"/></svg>,
};

const Category = () => {
  const { name } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categoryTitle = name ? name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Eyeglasses';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await getProducts({ category: name === 'all' ? null : name });
      if (!error && data) {
        // Real-time Inference Fallback
        const processedProducts = data.map(p => ({
          ...p,
          color: p.color || (p.name.toLowerCase().includes('gold') ? 'Gold' : 
                           p.name.toLowerCase().includes('silver') ? 'Silver' : 
                           p.name.toLowerCase().includes('black') ? 'Black' : 
                           p.name.toLowerCase().includes('brown') ? 'Brown' : 
                           p.name.toLowerCase().includes('blue') ? 'Blue' : 
                           p.name.toLowerCase().includes('transparent') ? 'Transparent' : 
                           p.name.toLowerCase().includes('gunmetal') ? 'Gunmetal' : 'Black'),
          frame_shape: p.frame_shape || p.shape || (p.name.toLowerCase().includes('aviator') ? 'Aviator' : 
                                                   p.name.toLowerCase().includes('round') ? 'Round' : 
                                                   p.name.toLowerCase().includes('square') ? 'Square' : 
                                                   p.name.toLowerCase().includes('rectangle') ? 'Rectangle' : 
                                                   p.name.toLowerCase().includes('geometric') ? 'Geometric' : 
                                                   p.name.toLowerCase().includes('cat eye') ? 'Cat Eye' : 'Rectangle'),
          frame_type: p.frame_type || (p.name.toLowerCase().includes('rimless') ? 'Rimless' : 
                                      p.name.toLowerCase().includes('half') ? 'Half Rim' : 'Full Rim')
        }));
        setProducts(processedProducts);
        setFilteredProducts(processedProducts);
      }
      setLoading(false);
    };
    fetchProducts();
    window.scrollTo(0, 0);
  }, [name]);

  const handleThemeChange = (theme) => {
    const updated = selectedThemes.includes(theme) ? selectedThemes.filter(t => t !== theme) : [...selectedThemes, theme];
    setSelectedThemes(updated);
    applyFiltersAndSort(products, selectedShapes, selectedTypes, selectedColors, updated, sortBy);
  };

  const handleShapeChange = (shape) => {
    const updated = selectedShapes.includes(shape) ? selectedShapes.filter(s => s !== shape) : [...selectedShapes, shape];
    setSelectedShapes(updated);
    applyFiltersAndSort(products, updated, selectedTypes, selectedColors, selectedThemes, sortBy);
  };

  const handleTypeChange = (type) => {
    const updated = selectedTypes.includes(type) ? selectedTypes.filter(t => t !== type) : [...selectedTypes, type];
    setSelectedTypes(updated);
    applyFiltersAndSort(products, selectedShapes, updated, selectedColors, selectedThemes, sortBy);
  };

  const handleColorChange = (color) => {
    const updated = selectedColors.includes(color) ? selectedColors.filter(c => c !== color) : [...selectedColors, color];
    setSelectedColors(updated);
    applyFiltersAndSort(products, selectedShapes, selectedTypes, updated, selectedThemes, sortBy);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    applyFiltersAndSort(products, selectedShapes, selectedTypes, selectedColors, selectedThemes, newSort);
  };

  const applyFiltersAndSort = React.useCallback((allProducts, shapes, types, colors, themes, sort) => {
    let result = [...allProducts];

    if (shapes.length > 0) result = result.filter(p => shapes.includes(p.frame_shape || p.shape));
    if (types.length > 0) result = result.filter(p => types.includes(p.frame_type));
    if (colors.length > 0) result = result.filter(p => colors.includes(p.color));
    if (themes && themes.length > 0) result = result.filter(p => themes.includes(p.theme));

    if (sort === 'price-low') result.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price-high') result.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'newest') result.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

    setFilteredProducts(result);
  }, []);

  // Memoized counts for performance
  const filterCounts = React.useMemo(() => {
    const counts = {
      types: {},
      shapes: {},
      colors: {},
      themes: {}
    };

    products.forEach(p => {
      const type = p.frame_type;
      const shape = p.frame_shape || p.shape;
      const color = p.color;
      const theme = p.theme;

      if (type) counts.types[type] = (counts.types[type] || 0) + 1;
      if (shape) counts.shapes[shape] = (counts.shapes[shape] || 0) + 1;
      if (color) counts.colors[color] = (counts.colors[color] || 0) + 1;
      if (theme) counts.themes[theme] = (counts.themes[theme] || 0) + 1;
    });

    return counts;
  }, [products]);

  return (
    <div className="bg-background text-primary min-h-screen relative overflow-x-hidden">
      {/* Editorial Header */}
      <header className="pt-32 pb-20 border-b border-divider">
        <div className="container">
           <div className="flex flex-col md:flex-row justify-between items-end gap-8">
              <div>
                 <FadeIn delay={0}>
                    <span className="text-xs font-sans font-semibold uppercase tracking-[0.3em] text-accent mb-6 block">
                       Collection / Archive
                    </span>
                 </FadeIn>
                  <h1 className="text-5xl md:text-7xl leading-tight tracking-tighter text-heading break-words font-medium">
                     <RevealText text={categoryTitle.toUpperCase()} delay={0.1} />
                     <RevealText text="." delay={0.2} className="italic text-body" />
                  </h1>
              </div>
              
               <FadeIn delay={0.3} className="flex flex-col items-start md:items-end gap-4 text-xs font-sans font-semibold uppercase tracking-widest text-body">
                  <span>{filteredProducts.length} Objects Found</span>
                  <div className="w-12 h-px bg-divider" />
                  <div className="flex items-center gap-2">
                     <span>Sort</span>
                     <select
                       className="bg-transparent border-none outline-none text-heading font-bold cursor-pointer"
                       value={sortBy}
                       onChange={(e) => handleSortChange(e.target.value)}
                     >
                       <option value="recommended">Best Sellers</option>
                       <option value="price-low">Price Low</option>
                       <option value="price-high">Price High</option>
                       <option value="newest">Newest</option>
                     </select>
                  </div>
               </FadeIn>
           </div>
        </div>
      </header>

      <div className="container py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
           {/* Minimal Sidebar */}
            {/* Advanced Filters Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
               <FadeIn delay={0.4} className="sticky top-32 space-y-12">
                  
                  {/* Frame Type */}
                  <div>
                    <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-body mb-6 border-b border-divider pb-2">Frame Type</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {['Full Rim', 'Rimless', 'Half Rim'].map(type => {
                            const Icon = FrameIcons[type];
                            const isSelected = selectedTypes.includes(type);
                            // Count across total results, respecting other category filters
                            const count = filterCounts.types[type] || 0;

                            return (
                                <button 
                                    key={type}
                                    onClick={() => handleTypeChange(type)}
                                    disabled={count === 0 && !isSelected}
                                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-300 group ${
                                        isSelected ? 'border-primary bg-primary text-white scale-[1.02]' : 'border-divider hover:border-accent text-body hover:text-primary'
                                    } ${count === 0 && !isSelected ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                                >
                                    <div className={`mb-2 transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'text-white' : 'text-primary'}`}>
                                        <Icon />
                                    </div>
                                    <div className="flex flex-col items-center">
                                       <span className="text-[9px] font-bold uppercase tracking-widest">{type}</span>
                                       <span className="text-[8px] opacity-40 font-mono">({count})</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                  </div>

                  {/* Frame Shape */}
                  <div>
                    <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-body mb-6 border-b border-divider pb-2">Frame Shape</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {['Round', 'Square', 'Rectangle', 'Cat Eye', 'Geometric', 'Aviator'].map(shape => {
                            const Icon = FrameIcons[shape];
                            const isSelected = selectedShapes.includes(shape);
                             // Count across total results, respecting other category filters
                             const count = filterCounts.shapes[shape] || 0;

                            return (
                                <button 
                                    key={shape}
                                    onClick={() => handleShapeChange(shape)}
                                    disabled={count === 0 && !isSelected}
                                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-300 group ${
                                        isSelected ? 'border-primary bg-primary text-white scale-[1.02]' : 'border-divider hover:border-accent text-body hover:text-primary'
                                    } ${count === 0 && !isSelected ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                                >
                                    <div className={`mb-2 transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'text-white' : 'text-primary'}`}>
                                        <Icon />
                                    </div>
                                    <div className="flex flex-col items-center">
                                       <span className="text-[9px] font-bold uppercase tracking-widest">{shape}</span>
                                       <span className="text-[8px] opacity-40 font-mono">({count})</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                  </div>

                  {/* Frame Colors */}
                  <div>
                    <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-body mb-6 border-b border-divider pb-2">Frame Color</h4>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                        {['Black', 'Gold', 'Silver', 'Gunmetal', 'Transparent', 'Brown', 'Blue', 'Rose Gold'].map(color => {
                            const isSelected = selectedColors.includes(color);
                            // Predictive count
                            const count = products.filter(p => {
                                const matchesShape = selectedShapes.length === 0 || selectedShapes.includes(p.frame_shape);
                                const matchesType = selectedTypes.length === 0 || selectedTypes.includes(p.frame_type);
                                return matchesShape && matchesType && p.color === color;
                            }).length;

                            return (
                                <button 
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    disabled={count === 0 && !isSelected}
                                    className={`flex items-center justify-between w-full group transition-colors ${count === 0 && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${isSelected ? 'border-accent bg-accent' : 'border-divider'}`}>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className={`text-[11px] font-medium tracking-wide transition-colors ${isSelected ? 'text-accent' : 'text-body group-hover:text-primary'}`}>
                                            {color}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-secondary/40 font-mono">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Themes */}
                <div className="pt-8">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-body mb-6 border-b border-divider pb-2">Style Theme</h4>
                  <div className="grid grid-cols-2 gap-2">
                      {['Classic', 'Modern', 'Luxury', 'Minimalist', 'Sport', 'Vintage'].map(theme => {
                          const isSelected = selectedThemes.includes(theme);
                          const count = products.filter(p => {
                               const matchesShape = selectedShapes.length === 0 || selectedShapes.includes(p.frame_shape);
                               const matchesType = selectedTypes.length === 0 || selectedTypes.includes(p.frame_type);
                               const matchesColor = selectedColors.length === 0 || selectedColors.includes(p.color);
                               return matchesShape && matchesType && matchesColor && p.theme === theme;
                           }).length;
                          return (
                              <button 
                                  key={theme}
                                  onClick={() => handleThemeChange(theme)}
                                  className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                      isSelected ? 'bg-primary text-white border-primary' : 'border-divider text-body hover:border-accent hover:text-primary'
                                  }`}
                              >
                                  {theme} ({count})
                              </button>
                          );
                      })}
                  </div>
                </div>
             </FadeIn>
            </aside>

           {/* Results Grid */}
           <main className="lg:col-span-9">
              {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                       <div key={i} className="aspect-[3/4] bg-surface-flat rounded-2xl animate-pulse" />
                    ))}
                 </div>
              ) : (
                 <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-12 gap-y-12 md:gap-y-24">
                    {filteredProducts.map((product) => (
                       <StaggerItem key={product.id}>
                          <ProductCard product={product} />
                       </StaggerItem>
                    ))}
                 </StaggerContainer>
              )}
           </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={TRANSITIONS.cinema}
               onClick={() => setIsMobileFilterOpen(false)}
               className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[2000]"
            />
            <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: 0 }}
               exit={{ x: '-100%' }}
               transition={TRANSITIONS.cinemaIn}
               className="fixed top-0 left-0 h-full w-[85vw] max-w-sm glass-panel z-[2001] p-8 overflow-y-auto"
            >
               <div className="flex justify-between items-center mb-12">
                  <span className="text-xs font-sans font-semibold tracking-widest text-primary uppercase">FILTERS</span>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="w-10 h-10 rounded-full border border-divider flex items-center justify-center hover:bg-surface-flat transition-colors">
                    <X size={18} strokeWidth={1.5} />
                  </button>
               </div>

                <div className="space-y-12 pb-20">
                   <div>
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Frame Type</h4>
                      <div className="grid grid-cols-2 gap-3">
                         {['Full Rim', 'Rimless', 'Half Rim'].map(type => {
                            const Icon = FrameIcons[type];
                            const isSelected = selectedTypes.includes(type);
                            const count = filterCounts.types[type] || 0;
                            return (
                                <button 
                                   key={type} 
                                   onClick={() => handleTypeChange(type)}
                                   disabled={count === 0 && !isSelected}
                                   className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-300 ${isSelected ? 'border-primary bg-primary text-white' : 'border-divider text-secondary'} ${count === 0 && !isSelected ? 'opacity-30' : ''}`}
                                >
                                   <div className={`mb-2 ${isSelected ? 'text-white' : 'text-primary'}`}><Icon /></div>
                                   <span className="text-[9px] font-bold uppercase tracking-widest">{type} ({count})</span>
                                </button>
                            );
                         })}
                      </div>
                   </div>

                   <div>
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Frame Shape</h4>
                      <div className="grid grid-cols-2 gap-3">
                         {['Round', 'Square', 'Rectangle', 'Cat Eye', 'Geometric', 'Aviator'].map(shape => {
                            const Icon = FrameIcons[shape];
                            const isSelected = selectedShapes.includes(shape);
                             const count = filterCounts.shapes[shape] || 0;
                            return (
                                <button 
                                   key={shape} 
                                   onClick={() => handleShapeChange(shape)}
                                   disabled={count === 0 && !isSelected}
                                   className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-300 ${isSelected ? 'border-primary bg-primary text-white' : 'border-divider text-secondary'} ${count === 0 && !isSelected ? 'opacity-30' : ''}`}
                                >
                                   <div className={`mb-2 ${isSelected ? 'text-white' : 'text-primary'}`}><Icon /></div>
                                   <span className="text-[9px] font-bold uppercase tracking-widest">{shape} ({count})</span>
                                </button>
                            );
                         })}
                      </div>
                   </div>

                   <div>
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Frame Color</h4>
                      <div className="grid grid-cols-2 gap-3">
                         {['Black', 'Gold', 'Silver', 'Gunmetal', 'Transparent', 'Brown', 'Blue', 'Rose Gold'].map(color => {
                            const isSelected = selectedColors.includes(color);
                            const count = products.filter(p => {
                                const matchesShape = selectedShapes.length === 0 || selectedShapes.includes(p.frame_shape);
                                const matchesType = selectedTypes.length === 0 || selectedTypes.includes(p.frame_type);
                                return matchesShape && matchesType && p.color === color;
                            }).length;
                            return (
                                <button 
                                   key={color} 
                                   onClick={() => handleColorChange(color)}
                                   disabled={count === 0 && !isSelected}
                                   className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-300 ${isSelected ? 'border-primary bg-primary text-white' : 'border-divider text-secondary'} ${count === 0 && !isSelected ? 'opacity-30' : ''}`}
                                >
                                   <span className="text-[10px] font-bold uppercase tracking-widest">{color} ({count})</span>
                                </button>
                            );
                         })}
                      </div>
                   </div>

                   <div>
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Style Theme</h4>
                      <div className="grid grid-cols-2 gap-3">
                         {['Classic', 'Modern', 'Luxury', 'Minimalist', 'Sport', 'Vintage'].map(theme => {
                            const isSelected = selectedThemes.includes(theme);
                            const count = filterCounts.themes[theme] || 0;
                            return (
                                <button 
                                   key={theme} 
                                   onClick={() => handleThemeChange(theme)}
                                   disabled={count === 0 && !isSelected}
                                   className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-300 ${isSelected ? 'border-primary bg-primary text-white' : 'border-divider text-secondary'} ${count === 0 && !isSelected ? 'opacity-30' : ''}`}
                                >
                                   <span className="text-[10px] font-bold uppercase tracking-widest">{theme} ({count})</span>
                                </button>
                            );
                         })}
                      </div>
                   </div>

                   <button 
                     onClick={() => setIsMobileFilterOpen(false)}
                     className="w-full bg-primary text-white py-6 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl"
                   >
                     Show Results ({filteredProducts.length})
                   </button>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Filter Bar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] lg:hidden mb-4">
         <div className="flex items-center gap-6 glass-panel rounded-full px-8 py-4">
             <button className="flex items-center gap-2 text-sm font-sans font-medium text-primary" onClick={() => setIsMobileFilterOpen(true)}>
                <SlidersHorizontal size={16} strokeWidth={1.5} />
                <span>Filter</span>
             </button>
             <div className="w-px h-4 bg-divider" />
             <button className="flex items-center gap-2 text-sm font-sans font-medium text-primary" onClick={() => setIsMobileFilterOpen(true)}>
                <ChevronDown size={16} strokeWidth={1.5} />
                <span>Sort</span>
             </button>
         </div>
      </div>
    </div>
  );
};

export default Category;
