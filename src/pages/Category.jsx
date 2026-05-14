import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ui/ProductCard';
import { FadeIn, RevealText, StaggerContainer, StaggerItem, TRANSITIONS } from '../components/ui/Motion';

import { subscribeProducts } from '../lib/firebase';

const FrameIcons = {
    // Shapes
    Round: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="30" cy="20" r="15"/><circle cx="70" cy="20" r="15"/><path d="M45 20h10"/></svg>,
    Square: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="15" y="10" width="30" height="20" rx="2"/><rect x="55" y="10" width="30" height="20" rx="2"/><path d="M45 20h10"/></svg>,
    Rectangle: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="10" y="12" width="35" height="16" rx="1"/><rect x="55" y="12" width="35" height="16" rx="1"/><path d="M45 20h10"/></svg>,
    'Cat Eye': () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 20c0-8 15-12 30-5 0 0 5 0 5 0s5 0 5 0c15-7 30-3 30 5-5 8-15 10-30 5 0 0-5 0-5 0s-5 0-5 0c-15 5-25 3-30-5z"/><path d="M45 20h10"/></svg>,
    Aviator: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 10c15 0 25 15 25 22 0 5-10 8-25 0-15-8-15-22 0-22zM85 10c-15 0-25 15-25 22 0 5 10 8 25 0 15-8 15-22 0-22z"/><path d="M40 15h20M40 22h20"/></svg>,
    Geometric: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 20l10-10h20l10 10-10 10h-20zM90 20l-10-10h-20l-10 10 10 10h20z"/><path d="M40 20h20"/></svg>,
    Oval: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="30" cy="20" rx="17" ry="12"/><ellipse cx="70" cy="20" rx="17" ry="12"/><path d="M47 20h6"/></svg>,
    Wayfarer: () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 11h34l-5 22H20zM54 11h34l-8 22H59z"/><path d="M46 20h8"/></svg>,

    // Types
    'Full Rim': () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="30" cy="20" r="14"/><circle cx="70" cy="20" r="14"/><path d="M44 20h12"/></svg>,
    'Rimless': () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"><circle cx="30" cy="20" r="14"/><circle cx="70" cy="20" r="14"/><path d="M44 20h12" strokeDasharray="0"/></svg>,
    'Half Rim': () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 20a14 14 0 0 1 28 0M56 20a14 14 0 0 1 28 0"/><path d="M44 20h12"/></svg>,
    'Low Bridge Fit': () => <svg viewBox="0 0 100 40" className="w-12 h-6" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="15" y="10" width="30" height="20" rx="6"/><rect x="55" y="10" width="30" height="20" rx="6"/><path d="M45 21c4-5 6-5 10 0"/><path d="M11 16h6M83 16h6"/></svg>,
};

const FRAME_TYPE_OPTIONS = ['Full Rim', 'Rimless', 'Half Rim', 'Low Bridge Fit'];
const FRAME_SHAPE_OPTIONS = ['Round', 'Square', 'Rectangle', 'Cat Eye', 'Geometric', 'Aviator', 'Oval', 'Wayfarer'];
const COLOR_OPTIONS = ['Black', 'Gold', 'Silver', 'Gunmetal', 'Transparent', 'Brown', 'Blue', 'Rose Gold'];
const THEME_OPTIONS = ['Classic', 'Modern', 'Luxury', 'Minimalist', 'Sport', 'Vintage'];

const COLOR_MAP = {
    'Black': '#000000',
    'Gold': '#D4AF37',
    'Silver': '#C0C0C0',
    'Gunmetal': '#2C3539',
    'Transparent': '#F1F5F9',
    'Brown': '#5C4033',
    'Blue': '#1E3A8A',
    'Rose Gold': '#B76E79',
    'Green': '#16A34A',
    'Gray': '#9CA3AF',
    'Grey': '#9CA3AF',
    'Clear': '#FFFFFF',
    'Honey': '#D97706',
    'Hazel': '#8B5E34'
};

const HEX_COLOR_MAP = {
  '#000000': 'Black',
  '#111111': 'Black',
  '#d4af37': 'Gold',
  '#c0c0c0': 'Silver',
  '#2c3539': 'Gunmetal',
  '#5c4033': 'Brown',
  '#1e3a8a': 'Blue',
  '#b76e79': 'Rose Gold',
};

const normalizeText = (value = '') => String(value)
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const toTitleCase = (value = '') => String(value)
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()
  .replace(/\b\w/g, (char) => char.toUpperCase());

const findOption = (value, options) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return '';
  return options.find((option) => normalizeText(option) === normalizedValue) || '';
};

const inferOptionFromText = (text, options) => {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return '';
  return [...options]
    .sort((a, b) => normalizeText(b).length - normalizeText(a).length)
    .find((option) => normalizedText.includes(normalizeText(option))) || '';
};

const getProductText = (product = {}) => [
  product.name,
  product.brand,
  product.category,
  product.tags,
  product.description,
].filter(Boolean).join(' ');

const normalizeColorName = (value) => {
  if (!value) return '';
  const raw = typeof value === 'string'
    ? value
    : value.name || value.label || value.color || value.hex || '';
  const cleaned = String(raw).trim();
  if (['default', 'standard'].includes(normalizeText(cleaned))) return '';
  const hexMatch = cleaned.match(/^#[0-9a-f]{3,8}$/i);
  if (hexMatch) return HEX_COLOR_MAP[cleaned.toLowerCase()] || '';
  const known = findOption(cleaned, COLOR_OPTIONS);
  return known || inferOptionFromText(cleaned, COLOR_OPTIONS) || toTitleCase(cleaned);
};

const getProductColors = (product = {}) => {
  const explicitColors = [
    product.color,
    product.frame_color,
    product.frameColor,
    product.color_name,
    product.colorName,
    ...(Array.isArray(product.colors) ? product.colors : []),
    ...(Array.isArray(product.available_colors) ? product.available_colors : []),
  ].map(normalizeColorName).filter(Boolean);

  const inferred = inferOptionFromText(getProductText(product), COLOR_OPTIONS);
  const colors = explicitColors.length ? explicitColors : [inferred || 'Black'];
  return Array.from(new Set(colors));
};

const getCreatedSeconds = (createdAt) => {
  if (!createdAt) return 0;
  if (typeof createdAt.seconds === 'number') return createdAt.seconds;
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis() / 1000;
  const parsed = Date.parse(createdAt);
  return Number.isFinite(parsed) ? parsed / 1000 : 0;
};

const getPrice = (product = {}) => Number(product.price || product.consumersPrice || 0);

const categoryMatches = (productCategory, routeName) => {
  if (!routeName || routeName === 'all') return true;

  const target = normalizeText(routeName);
  const category = normalizeText(productCategory);

  if (target.includes('contact') || target === 'contacts') {
    return category.includes('contact') || category === 'contacts';
  }

  return category === target ||
    category.replace(/\s+/g, '-') === routeName ||
    category.replace(/\s+/g, '') === target.replace(/\s+/g, '');
};

const normalizeCategoryProduct = (product = {}) => {
  const text = getProductText(product);
  const shape = findOption(product.frame_shape || product.frameShape || product.shape, FRAME_SHAPE_OPTIONS)
    || inferOptionFromText(text, FRAME_SHAPE_OPTIONS)
    || 'Rectangle';
  const type = findOption(product.frame_type || product.frameType, FRAME_TYPE_OPTIONS)
    || inferOptionFromText(text, FRAME_TYPE_OPTIONS)
    || 'Full Rim';
  // Infer theme from name/desc/tags; fall back to 'Classic' so every product has a theme
  const theme = findOption(product.theme, THEME_OPTIONS)
    || inferOptionFromText(text, THEME_OPTIONS)
    || 'Classic';
  const colors = getProductColors(product);

  return {
    ...product,
    frame_shape: shape,
    frame_type: type,
    color: colors[0] || 'Black',
    theme,
    filter_colors: colors,
  };
};

const getFilterValues = (product, attr) => {
  if (attr === 'shape') return [product.frame_shape || product.shape].filter(Boolean);
  if (attr === 'type') return [product.frame_type].filter(Boolean);
  if (attr === 'color') return product.filter_colors || [product.color].filter(Boolean);
  return [product.theme].filter(Boolean);
};

const matchesSelection = (values, selected) => (
  selected.length === 0 || values.some((value) => selected.includes(value))
);

const matchesFilters = (product, filters) => (
  matchesSelection(getFilterValues(product, 'shape'), filters.shapes)
  && matchesSelection(getFilterValues(product, 'type'), filters.types)
  && matchesSelection(getFilterValues(product, 'color'), filters.colors)
  && matchesSelection(getFilterValues(product, 'theme'), filters.themes)
);

const sortProducts = (products, sort) => {
  const result = [...products];
  if (sort === 'price-low') result.sort((a, b) => getPrice(a) - getPrice(b));
  else if (sort === 'price-high') result.sort((a, b) => getPrice(b) - getPrice(a));
  else if (sort === 'newest') result.sort((a, b) => getCreatedSeconds(b.created_at) - getCreatedSeconds(a.created_at));
  return result;
};

const mergeOptions = (baseOptions, values) => {
  const merged = [...baseOptions];
  values.filter(Boolean).forEach((value) => {
    if (!merged.some((option) => normalizeText(option) === normalizeText(value))) {
      merged.push(value);
    }
  });
  return merged;
};

const getColorSwatch = (color) => COLOR_MAP[color] || (/^#[0-9a-f]{3,8}$/i.test(color) ? color : '#CBD5E1');

const Category = () => {
  const { name } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categoryTitle = name ? name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Eyeglasses';

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeProducts({ category: null }, (data) => {
      const processedProducts = (data || [])
        .filter((product) => categoryMatches(product.category, name))
        .map(normalizeCategoryProduct);

      setProducts(processedProducts);
      setLoading(false);
    }, () => setLoading(false));
    window.scrollTo(0, 0);
    return unsubscribe;
  }, [name]);

  useEffect(() => {
    setSelectedShapes([]);
    setSelectedTypes([]);
    setSelectedColors([]);
    setSelectedThemes([]);
    setSortBy('recommended');
    setIsMobileFilterOpen(false);
  }, [name]);

  const filteredProducts = React.useMemo(() => {
    const selected = {
      shapes: selectedShapes,
      types: selectedTypes,
      colors: selectedColors,
      themes: selectedThemes,
    };

    return sortProducts(products.filter((product) => matchesFilters(product, selected)), sortBy);
  }, [products, selectedShapes, selectedTypes, selectedColors, selectedThemes, sortBy]);

  const typeOptions = React.useMemo(
    () => mergeOptions(FRAME_TYPE_OPTIONS, products.map((product) => product.frame_type)),
    [products]
  );

  const shapeOptions = React.useMemo(
    () => mergeOptions(FRAME_SHAPE_OPTIONS, products.map((product) => product.frame_shape)),
    [products]
  );

  const colorOptions = React.useMemo(
    () => mergeOptions(COLOR_OPTIONS, products.flatMap((product) => product.filter_colors || [])),
    [products]
  );

  const themeOptions = React.useMemo(
    () => mergeOptions(THEME_OPTIONS, products.map((product) => product.theme)),
    [products]
  );

  const handleThemeChange = (theme) => {
    setSelectedThemes((current) => current.includes(theme) ? current.filter(t => t !== theme) : [...current, theme]);
  };

  const handleShapeChange = (shape) => {
    setSelectedShapes((current) => current.includes(shape) ? current.filter(s => s !== shape) : [...current, shape]);
  };

  const handleTypeChange = (type) => {
    setSelectedTypes((current) => current.includes(type) ? current.filter(t => t !== type) : [...current, type]);
  };

  const handleColorChange = (color) => {
    setSelectedColors((current) => current.includes(color) ? current.filter(c => c !== color) : [...current, color]);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
  };

  // Returns how many products match ALL OTHER filter groups AND have this attr value.
  // This is the correct number to display beside each filter chip.
  const getAvailabilityCount = React.useCallback((attr, value, currentFilters) => {
    const { shapes, types, colors, themes } = currentFilters;
    return products.filter(p => {
      const filterSet = {
        shapes: attr === 'shape' ? [] : shapes,
        types: attr === 'type' ? [] : types,
        colors: attr === 'color' ? [] : colors,
        themes: attr === 'theme' ? [] : themes,
      };
      return matchesFilters(p, filterSet) && getFilterValues(p, attr).includes(value);
    }).length;
  }, [products]);

  return (
    <div className="bg-background text-primary min-h-screen relative overflow-x-hidden">
      {/* Editorial Header */}
      <header className="pt-6 pb-4 border-b border-divider">
        <div className="container">
           <div className="flex flex-col md:flex-row justify-between items-end gap-8">
              <div>
                <FadeIn delay={0}>
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-accent mb-2 block">
                    Collection / Archive
                  </span>
                </FadeIn>
                <h1 className="text-3xl md:text-5xl leading-tight tracking-tighter text-heading break-words font-medium uppercase">
                  <RevealText text={categoryTitle} delay={0.1} />
                </h1>
              </div>

               <FadeIn delay={0.3} className="flex flex-col items-start md:items-end gap-2 text-[10px] font-sans font-semibold uppercase tracking-widest text-body">
                  <span>{filteredProducts.length} Objects</span>
                  <div className="flex items-center gap-2">
                     <span className="opacity-50">Sort</span>
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


      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
           {/* Minimal Sidebar */}
            {/* Advanced Filters Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
               <FadeIn delay={0.4} className="sticky top-32 space-y-12">

                  {/* Frame Type */}
                  <div>
                    <h4 className="text-[12px] font-sans font-black uppercase tracking-[0.25em] text-primary mb-6 border-b-2 border-primary/10 pb-3">Frame Type</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {typeOptions.map(type => {
                            const Icon = FrameIcons[type] || FrameIcons['Full Rim'];
                            const isSelected = selectedTypes.includes(type);
                            const availabilityCount = getAvailabilityCount('type', type, { shapes: selectedShapes, types: selectedTypes, colors: selectedColors, themes: selectedThemes });

                            return (
                                <button
                                    key={type}
                                    onClick={() => handleTypeChange(type)}
                                    disabled={availabilityCount === 0 && !isSelected}
                                    className={`flex flex-col items-center justify-center p-5 border-2 rounded-2xl transition-all duration-300 group shadow-sm ${
                                        isSelected ? 'border-primary bg-primary text-white scale-[1.05] shadow-xl shadow-primary/20' : 'border-slate-200 hover:border-primary/30 text-slate-500 hover:text-primary hover:bg-slate-50'
                                    } ${availabilityCount === 0 && !isSelected ? 'opacity-10 grayscale cursor-not-allowed' : ''}`}
                                >
                                    <div className={`mb-3 transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'text-white' : 'text-primary'}`}>
                                        <Icon />
                                    </div>
                                    <div className="flex flex-col items-center">
                                       <span className="text-[11px] font-black uppercase tracking-widest leading-none">{type}</span>
                                       <span className={`text-[9px] mt-1 font-mono font-bold ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>({availabilityCount})</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[12px] font-sans font-black uppercase tracking-[0.25em] text-primary mb-6 border-b-2 border-primary/10 pb-3">Frame Shape</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {shapeOptions.map(shape => {
                            const Icon = FrameIcons[shape] || FrameIcons.Rectangle;
                            const isSelected = selectedShapes.includes(shape);
                            const availabilityCount = getAvailabilityCount('shape', shape, { shapes: selectedShapes, types: selectedTypes, colors: selectedColors, themes: selectedThemes });

                            return (
                                <button
                                    key={shape}
                                    onClick={() => handleShapeChange(shape)}
                                    disabled={availabilityCount === 0 && !isSelected}
                                    className={`flex flex-col items-center justify-center p-5 border-2 rounded-2xl transition-all duration-300 group shadow-sm ${
                                        isSelected ? 'border-primary bg-primary text-white scale-[1.05] shadow-xl shadow-primary/20' : 'border-slate-200 hover:border-primary/30 text-slate-500 hover:text-primary hover:bg-slate-50'
                                    } ${availabilityCount === 0 && !isSelected ? 'opacity-10 grayscale cursor-not-allowed' : ''}`}
                                >
                                    <div className={`mb-3 transition-transform duration-500 group-hover:scale-110 ${isSelected ? 'text-white' : 'text-primary'}`}>
                                        <Icon />
                                    </div>
                                    <div className="flex flex-col items-center">
                                       <span className="text-[11px] font-black uppercase tracking-widest leading-none">{shape}</span>
                                       <span className={`text-[9px] mt-1 font-mono font-bold ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>({availabilityCount})</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[12px] font-sans font-black uppercase tracking-[0.25em] text-primary mb-6 border-b-2 border-primary/10 pb-3">Frame Color</h4>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                        {colorOptions.map(color => {
                            const isSelected = selectedColors.includes(color);
                            const availabilityCount = getAvailabilityCount('color', color, { shapes: selectedShapes, types: selectedTypes, colors: selectedColors, themes: selectedThemes });

                            return (
                                <button
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    disabled={availabilityCount === 0 && !isSelected}
                                    className={`flex items-center justify-between w-full group transition-all p-3 rounded-xl hover:bg-slate-100/50 ${availabilityCount === 0 && !isSelected ? 'opacity-20 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shadow-inner ${isSelected ? 'border-primary' : 'border-slate-200 group-hover:border-primary'}`} style={{ backgroundColor: getColorSwatch(color) }}>
                                            {isSelected && <div className={`w-1.5 h-1.5 rounded-full ${color === 'Black' || color === 'Blue' || color === 'Brown' ? 'bg-white' : 'bg-black'}`} />}
                                        </div>
                                        <span className={`text-[12px] font-black tracking-wide transition-colors ${isSelected ? 'text-primary' : 'text-slate-600 group-hover:text-primary'}`}>
                                            {color}
                                        </span>
                                    </div>
                                    <span className={`text-[11px] font-mono font-black ${isSelected ? 'text-primary' : 'text-slate-400'}`}>({availabilityCount})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-8">
                  <h4 className="text-[12px] font-sans font-black uppercase tracking-[0.25em] text-primary mb-6 border-b-2 border-primary/10 pb-3">Style Theme</h4>
                  <div className="grid grid-cols-2 gap-3">
                      {themeOptions.map(theme => {
                          const isSelected = selectedThemes.includes(theme);
                          const availabilityCount = getAvailabilityCount('theme', theme, { shapes: selectedShapes, types: selectedTypes, colors: selectedColors, themes: selectedThemes });

                          return (
                              <button
                                  key={theme}
                                  onClick={() => handleThemeChange(theme)}
                                  disabled={availabilityCount === 0 && !isSelected}
                                  className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all shadow-sm ${
                                      isSelected ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-slate-200 text-slate-500 hover:border-primary/30 hover:text-primary hover:bg-slate-50'
                                  } ${availabilityCount === 0 && !isSelected ? 'opacity-10 cursor-not-allowed' : ''}`}
                              >
                                  {theme} ({availabilityCount})
                              </button>
                          );
                      })}
                  </div>
                </div>
             </FadeIn>
            </aside>

           <main className="lg:col-span-9">
              {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                       <div key={i} className="aspect-[3/4] bg-surface-flat rounded-2xl animate-pulse" />
                    ))}
                 </div>
              ) : (
                  filteredProducts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 text-center">
                      <span className="text-6xl mb-6">🔍</span>
                      <h3 className="text-lg font-black uppercase tracking-widest text-slate-800 mb-2">No Results</h3>
                      <p className="text-sm text-slate-400 font-medium mb-8">No products match the selected filters.</p>
                      <button
                        onClick={() => { setSelectedShapes([]); setSelectedTypes([]); setSelectedColors([]); setSelectedThemes([]); }}
                        className="px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  ) : (
                    <div
                      key={`${selectedShapes.join('|')}-${selectedTypes.join('|')}-${selectedColors.join('|')}-${selectedThemes.join('|')}-${sortBy}`}
                      className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-12 gap-y-12 md:gap-y-24"
                    >
                      {filteredProducts.map((product) => (
                        <div key={product.id}>
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                  )
               )}
           </main>
        </div>
      </div>

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
                         {typeOptions.map(type => {
                            const isSelected = selectedTypes.includes(type);
                            const availabilityCount = getAvailabilityCount('type', type, { shapes: selectedShapes, types: selectedTypes, colors: selectedColors, themes: selectedThemes });
                            return (
                                <button
                                   key={type}
                                   onClick={() => handleTypeChange(type)}
                                   disabled={availabilityCount === 0 && !isSelected}
                                   className={`p-4 border rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${isSelected ? 'bg-primary text-white border-primary' : 'border-divider text-secondary'} ${availabilityCount === 0 && !isSelected ? 'opacity-30' : ''}`}
                                >
                                   {type} ({availabilityCount})
                                </button>
                            );
                         })}
                      </div>
                   </div>

                   <div>
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Frame Shape</h4>
                      <div className="grid grid-cols-2 gap-3">
                         {shapeOptions.map(shape => {
                            const Icon = FrameIcons[shape] || FrameIcons.Rectangle;
                            const isSelected = selectedShapes.includes(shape);
                            const availabilityCount = getAvailabilityCount('shape', shape, { shapes: selectedShapes, types: selectedTypes, colors: selectedColors, themes: selectedThemes });
                            return (
                                <button
                                   key={shape}
                                   onClick={() => handleShapeChange(shape)}
                                   disabled={availabilityCount === 0 && !isSelected}
                                   className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-300 ${isSelected ? 'border-primary bg-primary text-white' : 'border-divider text-secondary'} ${availabilityCount === 0 && !isSelected ? 'opacity-30' : ''}`}
                                >
                                   <div className={`mb-2 ${isSelected ? 'text-white' : 'text-primary'}`}><Icon /></div>
                                   <span className="text-[9px] font-bold uppercase tracking-widest">{shape} ({availabilityCount})</span>
                                </button>
                            );
                         })}
                      </div>
                   </div>

                   <div>
                       <h4 className="text-[12px] font-sans font-black uppercase tracking-[0.25em] text-primary mb-6 border-b-2 border-primary/10 pb-3">Frame Color</h4>
                       <div className="grid grid-cols-2 gap-3">
                          {colorOptions.map(color => {
                             const isSelected = selectedColors.includes(color);
                             const availabilityCount = getAvailabilityCount('color', color, { shapes: selectedShapes, types: selectedTypes, colors: selectedColors, themes: selectedThemes });
                             return (
                                 <button
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    disabled={availabilityCount === 0 && !isSelected}
                                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all duration-300 ${isSelected ? 'border-primary bg-primary text-white scale-[1.05]' : 'border-slate-200 text-slate-600'} ${availabilityCount === 0 && !isSelected ? 'opacity-10' : ''}`}
                                 >
                                    <div className={`w-5 h-5 rounded-full border mb-2`} style={{ backgroundColor: getColorSwatch(color) }} />
                                    <span className="text-[11px] font-black uppercase tracking-widest leading-none">{color}</span>
                                    <span className={`text-[9px] mt-1 font-mono font-bold ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>({availabilityCount})</span>
                                 </button>
                             );
                          })}
                       </div>
                    </div>

                   <div>
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Style Theme</h4>
                      <div className="grid grid-cols-2 gap-3">
                         {themeOptions.map(theme => {
                            const isSelected = selectedThemes.includes(theme);
                            const availabilityCount = getAvailabilityCount('theme', theme, { shapes: selectedShapes, types: selectedTypes, colors: selectedColors, themes: selectedThemes });
                            return (
                                <button
                                   key={theme}
                                   onClick={() => handleThemeChange(theme)}
                                   disabled={availabilityCount === 0 && !isSelected}
                                   className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all duration-300 ${isSelected ? 'border-primary bg-primary text-white' : 'border-divider text-secondary'} ${availabilityCount === 0 && !isSelected ? 'opacity-30' : ''}`}
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
