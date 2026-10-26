import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X, Filter, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ui/ProductCard';
import { FadeIn, RevealText, TRANSITIONS } from '../components/ui/Motion';

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
const ACCESSORY_TYPE_OPTIONS = ['Lens Cleaner', 'Microfiber Cloth', 'Contact Lens Solution', 'Spectacle Case'];

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
    'Hazel': '#8B5E34',
    'Red': '#EF4444',
    'Tortoise': '#8B5E34'
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
  
  if (typeof value === 'object') {
    const rawName = value.name || value.label || value.color || '';
    const cleaned = String(rawName).trim();
    if (['default', 'standard'].includes(normalizeText(cleaned))) return '';
    return toTitleCase(cleaned);
  }

  const raw = typeof value === 'string' ? value : '';
  const cleaned = String(raw).trim();
  if (['default', 'standard'].includes(normalizeText(cleaned))) return '';
  const hexMatch = cleaned.match(/^#[0-9a-f]{3,8}$/i);
  if (hexMatch) return HEX_COLOR_MAP[cleaned.toLowerCase()] || '';
  // Check dual colors first — so "Black Gold" isn't stripped to just "Black"
  const dualMatch = Object.keys(DUAL_COLOR_MAP).find(
    (k) => normalizeText(k) === normalizeText(cleaned)
  );
  if (dualMatch) return dualMatch;
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

  // Clip-on matching
  if (target.includes('clip') && category.includes('clip')) {
    return true;
  }

  // Reading glasses matching
  if (target.includes('read') && category.includes('read')) {
    return true;
  }

  // Computer glasses matching
  if (target.includes('computer') && category.includes('computer')) {
    return true;
  }

  // Sunglasses matching
  if (target.includes('sun') && category.includes('sun')) {
    return true;
  }

  // Accessories matching
  if (target.includes('accessor') && category.includes('accessor')) {
    return true;
  }

  // Support Eyewear and Eyeglasses matching
  if ((target === 'eyeglasses' || target === 'eyewear') &&
      (category === 'eyeglasses' || category === 'eyewear')) {
    return true;
  }

  return category === target ||
    category.replace(/\s+/g, '-') === routeName ||
    category.replace(/\s+/g, '') === target.replace(/\s+/g, '') ||
    category.replace(/[^a-z0-9]+/g, '-') === routeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

const productMatchesRoute = (product, routeName) => {
  if (!routeName || routeName === 'all') return true;

  const target = normalizeText(routeName);
  const gender = normalizeText(product.gender);

  // Check if route matches a gender
  if (['men', 'man', 'gents'].includes(target)) {
    return gender === 'men' || gender === 'unisex';
  }
  if (['women', 'woman', 'ladies'].includes(target)) {
    return gender === 'women' || gender === 'unisex';
  }
  if (['kids', 'child', 'children'].includes(target)) {
    return gender === 'kids';
  }

  // Fallback to category or product_type matching
  return categoryMatches(product.category, routeName) || categoryMatches(product.product_type, routeName);
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
  if (attr === 'category') {
    if (categoryMatches(product.category, 'clip-on-glasses')) return ['Clip-on Glasses', 'Clip-On Glasses', 'clip-on-glasses', 'clip-on'];
    if (categoryMatches(product.category, 'computer-glasses')) return ['Computer Glasses', 'computer-glasses'];
    if (categoryMatches(product.category, 'reading-glasses')) return ['Reading Glasses', 'reading-glasses'];
    if (categoryMatches(product.category, 'sunglasses')) return ['Sunglasses', 'sunglasses'];
    if (categoryMatches(product.category, 'contact-lenses')) return ['Contact Lenses', 'contacts'];
    if (categoryMatches(product.category, 'accessories')) return ['Accessories', 'accessories'];
    if (categoryMatches(product.category, 'eyeglasses')) return ['Eyewear', 'Eyeglasses', 'eyeglasses'];
    return [product.category].filter(Boolean);
  }
  if (attr === 'material') return [product.frame_material].filter(Boolean);
  return [product.theme].filter(Boolean);
};

const matchesSelection = (values, selected) => (
  selected.length === 0 || values.some((value) => selected.includes(value))
);

const matchesFilters = (product, filters) => {
  const price = getPrice(product);

  // Category filter
  const matchesCategory = !filters.categories || filters.categories.length === 0 || 
    filters.categories.some(cat => categoryMatches(product.category, cat));

  // Material filter
  const matchesMaterial = !filters.materials || filters.materials.length === 0 ||
    filters.materials.some(mat => 
      String(product.frame_material || '').toLowerCase().includes(mat.toLowerCase())
    );

  // Accessory type filter
  const matchesAccessoryType = !filters.accessoryTypes || filters.accessoryTypes.length === 0 ||
    filters.accessoryTypes.some(at =>
      String(product.accessory_type || '').toLowerCase() === at.toLowerCase()
    );

  // Price filter
  const matchesPrice = !filters.priceRange || 
    (price >= filters.priceRange[0] && price <= filters.priceRange[1]);

  return matchesCategory
    && matchesMaterial
    && matchesPrice
    && matchesAccessoryType
    && matchesSelection(getFilterValues(product, 'shape'), filters.shapes)
    && matchesSelection(getFilterValues(product, 'type'), filters.types)
    && matchesSelection(getFilterValues(product, 'color'), filters.colors)
    && matchesSelection(getFilterValues(product, 'theme'), filters.themes);
};

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

// Dual-color map: color name → [top color, bottom color]
const DUAL_COLOR_MAP = {
  'Tortoise':     ['#8B5E34', '#1a1a1a'],
  'Black Gold':   ['#000000', '#D4AF37'],
  'Blue Gold':    ['#1E3A8A', '#D4AF37'],
  'Black Silver': ['#000000', '#C0C0C0'],
  'Brown Gold':   ['#5C4033', '#D4AF37'],
  'Transparent Blue': ['#EFF6FF', '#1E3A8A'],
  'Grey Blue':    ['#9CA3AF', '#1E3A8A'],
  'Pink Gold':    ['#F9A8D4', '#D4AF37'],
  'Multicolor':   ['#E53E3E', '#3182CE'],
};

const ColorSwatch = ({ color, isSelected, size = 'w-5 h-5', products = [] }) => {
  const borderCls = isSelected ? 'border-2 border-primary shadow-md' : 'border border-slate-200';

  const bgStyle = (() => {
    const dual = DUAL_COLOR_MAP[color];
    if (dual) {
      return `linear-gradient(135deg, ${dual[0]} 50%, ${dual[1]} 50%)`;
    }
    for (const product of products) {
      if (Array.isArray(product.colors)) {
        const match = product.colors.find(c => c && toTitleCase(c.name || '').trim() === color.trim());
        if (match) {
          if (match.is_dual_tone && match.hex2) {
            return `linear-gradient(135deg, ${match.hex} 50%, ${match.hex2} 50%)`;
          }
          if (match.hex) return match.hex;
        }
      }
      const baseColor = product.color || product.frame_color || product.frameColor;
      if (baseColor && toTitleCase(baseColor).trim() === color.trim()) {
        if (product.is_dual_tone && (product.hex2 || product.dual_color_hex)) {
          const h2 = product.hex2 || product.dual_color_hex;
          return `linear-gradient(135deg, ${product.color_hex || product.colorHex || '#e2e8f0'} 50%, ${h2} 50%)`;
        }
        if (product.color_hex || product.colorHex) {
          return product.color_hex || product.colorHex;
        }
      }
    }
    return getColorSwatch(color);
  })();

  return (
    <div
      className={`${size} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${borderCls}`}
      style={{ background: bgStyle }}
      title={color}
    >
      {isSelected && (
        <div className={`w-1.5 h-1.5 rounded-full ${['Black','Blue','Brown','Gunmetal'].includes(color) ? 'bg-white' : 'bg-slate-800'}`} />
      )}
    </div>
  );
};

const Category = () => {
  const { name } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedAccessoryTypes, setSelectedAccessoryTypes] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(20000);

  // Pending filter states for deferred 'Apply' button flow
  const [pendingShapes, setPendingShapes] = useState([]);
  const [pendingTypes, setPendingTypes] = useState([]);
  const [pendingColors, setPendingColors] = useState([]);
  const [pendingThemes, setPendingThemes] = useState([]);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [pendingMaterials, setPendingMaterials] = useState([]);
  const [pendingAccessoryTypes, setPendingAccessoryTypes] = useState([]);
  const [pendingMinPrice, setPendingMinPrice] = useState(0);
  const [pendingMaxPrice, setPendingMaxPrice] = useState(20000);

  const [sortBy, setSortBy] = useState('recommended');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const isAccessoriesRoute = (name || '').toLowerCase().includes('accessor');

  const [expandedFilters, setExpandedFilters] = useState({
    category: false,
    type: false,
    shape: false,
    color: false,
    material: false,
    price: false,
    accessoryType: false,
  });

  const toggleFilter = (key) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), pendingMaxPrice - 500);
    setPendingMinPrice(value);
  };
  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), pendingMinPrice + 500);
    setPendingMaxPrice(value);
  };

  const categoryTitle = name ? name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Eyeglasses';

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeProducts({ category: null }, (data) => {
      const processedProducts = (data || [])
        .filter((product) => productMatchesRoute(product, name))
        .map(normalizeCategoryProduct);

      setProducts(processedProducts);
      setLoading(false);
    }, () => setLoading(false));

    if (!sessionStorage.getItem('last_viewed_frame_id')) {
      window.scrollTo(0, 0);
    }

    return unsubscribe;
  }, [name]);

  // Restore scroll position and highlight the specific frame when navigating back to catalog
  useEffect(() => {
    if (!loading && products.length > 0) {
      const lastFrameId = sessionStorage.getItem('last_viewed_frame_id');
      if (lastFrameId) {
        const timer = setTimeout(() => {
          const el = document.getElementById(`product-${lastFrameId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-4', 'ring-primary', 'ring-offset-4', 'shadow-2xl', 'scale-[1.02]');
            setTimeout(() => {
              el.classList.remove('ring-4', 'ring-primary', 'ring-offset-4', 'shadow-2xl', 'scale-[1.02]');
            }, 2500);
          }
          sessionStorage.removeItem('last_viewed_frame_id');
        }, 180);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, products]);

  useEffect(() => {
    setSelectedShapes([]);
    setSelectedTypes([]);
    setSelectedColors([]);
    setSelectedThemes([]);
    setSelectedMaterials([]);
    setSelectedAccessoryTypes([]);
    setMinPrice(0);
    setMaxPrice(20000);

    setPendingShapes([]);
    setPendingTypes([]);
    setPendingColors([]);
    setPendingThemes([]);
    setPendingMaterials([]);
    setPendingAccessoryTypes([]);
    setPendingMinPrice(0);
    setPendingMaxPrice(20000);

    const initialCat = [];
    if (name && name !== 'all') {
      const normalizedRoute = name.toLowerCase();
      if (['men', 'man', 'gents', 'women', 'woman', 'ladies', 'kids', 'child', 'children', 'all'].includes(normalizedRoute)) {
        // Gender and "all" routes must NOT set category filters
      } else if (normalizedRoute.includes('sun')) {
        initialCat.push('Sunglasses');
      } else if (normalizedRoute === 'eyeglasses' || normalizedRoute === 'eyewear') {
        initialCat.push('Eyewear', 'Eyeglasses');
      } else if (normalizedRoute.includes('clip')) {
        initialCat.push('Clip-on Glasses', 'Clip-On Glasses');
      } else if (normalizedRoute.includes('computer')) {
        initialCat.push('Computer Glasses');
      } else if (normalizedRoute.includes('reading')) {
        initialCat.push('Reading Glasses');
      } else if (normalizedRoute.includes('contact') || normalizedRoute.includes('lens')) {
        initialCat.push('Contact Lenses');
      } else if (normalizedRoute.includes('accessor')) {
        initialCat.push('Accessories');
      } else {
        initialCat.push(toTitleCase(name));
      }
    }
    setSelectedCategories(initialCat);
    setPendingCategories(initialCat);

    setSortBy('recommended');
    setIsMobileFilterOpen(false);
    setExpandedFilters({
      category: false,
      type: false,
      shape: false,
      color: false,
      material: false,
      price: false,
      accessoryType: false,
    });
  }, [name]);

  useEffect(() => {
    if (isMobileFilterOpen) {
      setPendingShapes(selectedShapes);
      setPendingTypes(selectedTypes);
      setPendingColors(selectedColors);
      setPendingThemes(selectedThemes);
      setPendingCategories(selectedCategories);
      setPendingMaterials(selectedMaterials);
      setPendingAccessoryTypes(selectedAccessoryTypes);
      setPendingMinPrice(minPrice);
      setPendingMaxPrice(maxPrice);
    }
  }, [isMobileFilterOpen, selectedColors, selectedShapes, selectedThemes, selectedTypes, selectedCategories, selectedMaterials, selectedAccessoryTypes, minPrice, maxPrice]);

  const filteredProducts = React.useMemo(() => {
    const selected = {
      shapes: selectedShapes,
      types: selectedTypes,
      colors: selectedColors,
      themes: selectedThemes,
      categories: selectedCategories,
      materials: selectedMaterials,
      accessoryTypes: selectedAccessoryTypes,
      priceRange: [minPrice, maxPrice],
    };

    let result = products.filter((product) => matchesFilters(product, selected));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    return sortProducts(result, sortBy);
  }, [products, selectedShapes, selectedTypes, selectedColors, selectedThemes, selectedCategories, selectedMaterials, selectedAccessoryTypes, minPrice, maxPrice, sortBy, searchQuery]);

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
    setPendingThemes((current) => current.includes(theme) ? current.filter(t => t !== theme) : [...current, theme]);
  };

  const handleShapeChange = (shape) => {
    setPendingShapes((current) => current.includes(shape) ? current.filter(s => s !== shape) : [...current, shape]);
  };

  const handleTypeChange = (type) => {
    setPendingTypes((current) => current.includes(type) ? current.filter(t => t !== type) : [...current, type]);
  };

  const handleColorChange = (color) => {
    setPendingColors((current) => current.includes(color) ? current.filter(c => c !== color) : [...current, color]);
  };

  const handleApplyFilters = () => {
    setSelectedShapes(pendingShapes);
    setSelectedTypes(pendingTypes);
    setSelectedColors(pendingColors);
    setSelectedThemes(pendingThemes);
    setSelectedCategories(pendingCategories);
    setSelectedMaterials(pendingMaterials);
    setSelectedAccessoryTypes(pendingAccessoryTypes);
    setMinPrice(pendingMinPrice);
    setMaxPrice(pendingMaxPrice);
    setIsMobileFilterOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAll = () => {
    setPendingShapes([]);
    setPendingTypes([]);
    setPendingColors([]);
    setPendingThemes([]);
    setPendingCategories([]);
    setPendingMaterials([]);
    setPendingAccessoryTypes([]);
    setPendingMinPrice(0);
    setPendingMaxPrice(20000);

    setSelectedShapes([]);
    setSelectedTypes([]);
    setSelectedColors([]);
    setSelectedThemes([]);
    setSelectedCategories([]);
    setSelectedMaterials([]);
    setSelectedAccessoryTypes([]);
    setMinPrice(0);
    setMaxPrice(20000);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
  };

  const getAvailabilityCount = React.useCallback((attr, value, currentFilters) => {
    const { shapes, types, colors, themes, categories, materials, priceRange } = currentFilters;
    return products.filter(p => {
      const filterSet = {
        shapes: attr === 'shape' ? [] : shapes,
        types: attr === 'type' ? [] : types,
        colors: attr === 'color' ? [] : colors,
        themes: attr === 'theme' ? [] : themes,
        categories: attr === 'category' ? [] : (categories || []),
        materials: attr === 'material' ? [] : (materials || []),
        priceRange: priceRange || [0, 20000],
      };
      return matchesFilters(p, filterSet) && getFilterValues(p, attr).includes(value);
    }).length;
  }, [products]);

  const getCategoryMeta = (slug = '') => {
    const s = slug.toLowerCase();
    if (s.includes('sun') || s.includes('shade')) {
      return {
        title: 'Sun Collection',
        subtitle: 'High-performance sun protection meets iconic styling. Handcrafted frames designed to shield your vision in absolute style.',
        breadcrumbs: ['Home', 'Shop', 'Sunglasses']
      };
    }
    if (s.includes('contact') || s.includes('lens')) {
      return {
        title: 'Contact Lenses',
        subtitle: 'Precision optical solutions designed for optimal oxygen transmission, hydration, and long-lasting daily comfort.',
        breadcrumbs: ['Home', 'Shop', 'Contact Lenses']
      };
    }
    if (s.includes('clip')) {
      return {
        title: 'Clip-On Glasses',
        subtitle: 'Versatile 2-in-1 magnetic clip-on frames that switch seamlessly from indoor clear lenses to outdoor polarized sunglasses.',
        breadcrumbs: ['Home', 'Shop', 'Clip-On Glasses']
      };
    }
    if (s.includes('computer')) {
      return {
        title: 'Computer Glasses',
        subtitle: 'Anti-glare blue-light filtering frames designed to reduce eye strain, screen fatigue, and headaches during screen work.',
        breadcrumbs: ['Home', 'Shop', 'Computer Glasses']
      };
    }
    if (s.includes('read')) {
      return {
        title: 'Reading Glasses',
        subtitle: 'Magnified precision optical wear tailored for reading and close work with ergonomic, lightweight comfort.',
        breadcrumbs: ['Home', 'Shop', 'Reading Glasses']
      };
    }
    if (s.includes('kids') || s.includes('child')) {
      return {
        title: 'Kids Eyewear',
        subtitle: 'Durable, lightweight, and vibrant frames designed to match children\'s active lifestyles without compromising comfort.',
        breadcrumbs: ['Home', 'Shop', 'Kids']
      };
    }
    if (s === 'men' || s === 'man' || s === 'gents') {
      return {
        title: "Men's Eyewear",
        subtitle: 'Explore our curated collections of premium eyewear for men, handcrafted from lightweight titanium and fine Italian acetate.',
        breadcrumbs: ['Home', 'Shop', 'Men']
      };
    }
    if (s === 'women' || s === 'woman' || s === 'ladies') {
      return {
        title: "Women's Eyewear",
        subtitle: 'Explore our curated collections of premium eyewear for women, handcrafted from lightweight titanium and fine Italian acetate.',
        breadcrumbs: ['Home', 'Shop', 'Women']
      };
    }
    return {
      title: categoryTitle,
      subtitle: 'Explore our curated collections of premium eyewear, handcrafted from lightweight titanium and fine Italian acetate.',
      breadcrumbs: ['Home', 'Shop', categoryTitle]
    };
  };

  const catMeta = getCategoryMeta(name || '');

  return (
    <div className="bg-[#faf9f6] text-primary min-h-screen relative">
      {/* Editorial Header */}
      <header className="pt-8 pb-10 bg-white border-b border-gray-100">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 mb-4 text-[10px] md:text-xs font-semibold text-slate-400 tracking-wider uppercase">
            {catMeta.breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[8px] text-slate-300">/</span>}
                <span className={idx === catMeta.breadcrumbs.length - 1 ? 'text-slate-800 font-bold' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-end">
            <div className="md:col-span-8 lg:col-span-7">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent mb-2.5 block">
                Collection Archive
              </span>
              <h1 className="text-3xl md:text-5xl font-normal text-slate-900 leading-tight tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                {catMeta.title}
              </h1>
              <p className="text-sm md:text-base text-slate-500 font-normal leading-relaxed max-w-xl">
                {catMeta.subtitle}
              </p>
            </div>
            
            <div className="md:col-span-4 lg:col-span-5 flex flex-wrap md:justify-end items-center gap-6">
              <div className="text-left md:text-right border-l md:border-l-0 md:border-r border-slate-200 pl-4 md:pl-0 pr-0 md:pr-6 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Catalog Size</span>
                <span className="text-2xl font-black text-slate-900 leading-none">{filteredProducts.length} <span className="text-xs font-normal text-slate-500">items</span></span>
              </div>
              <div className="text-left border-l border-slate-200 pl-4 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Active filters</span>
                <span className="text-sm font-bold text-slate-800 leading-none">
                  {selectedShapes.length + selectedTypes.length + selectedColors.length + selectedThemes.length || 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1920px] mx-auto py-6 md:py-12 px-4 lg:px-8">
        
           {/* Minimal Sidebar */}
            {/* Advanced Filters Sidebar */}
            {/* Floating Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
              {(selectedShapes.length + selectedTypes.length + selectedColors.length + selectedThemes.length + (minPrice > 0 || maxPrice < 20000 ? 1 : 0)) > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-bold">
                  {selectedShapes.length + selectedTypes.length + selectedColors.length + selectedThemes.length + (minPrice > 0 || maxPrice < 20000 ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Active filter tags */}
            {selectedShapes.map(s => (
              <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg">
                {s}
                <button onClick={() => handleShapeChange(s)} className="hover:text-red-500 cursor-pointer"><X size={12} /></button>
              </span>
            ))}
            {selectedTypes.map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg">
                {t}
                <button onClick={() => handleTypeChange(t)} className="hover:text-red-500 cursor-pointer"><X size={12} /></button>
              </span>
            ))}
            {selectedColors.map(c => (
              <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg">
                {c}
                <button onClick={() => handleColorChange(c)} className="hover:text-red-500 cursor-pointer"><X size={12} /></button>
              </span>
            ))}

            {(selectedShapes.length > 0 || selectedTypes.length > 0 || selectedColors.length > 0 || selectedThemes.length > 0) && (
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider ml-1 cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Right: Sort By & Item Count */}
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              Showing {filteredProducts.length} frames
            </span>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-800 outline-none hover:border-slate-300 transition-all cursor-pointer"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>

            <main className="w-full">
              {loading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                         onClick={handleClearAll}
                         className="px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all"
                       >
                         Clear All Filters
                       </button>
                    </div>
                  ) : (
                    <div
                      key={`${selectedShapes.join('|')}-${selectedTypes.join('|')}-${selectedColors.join('|')}-${selectedThemes.join('|')}-${sortBy}`}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
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

      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={TRANSITIONS.cinema}
               onClick={() => setIsMobileFilterOpen(false)}
               className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[2000] category-filter-backdrop"
            />
            <motion.div
               initial={{ x: '-100%' }}
               animate={{ x: 0 }}
               exit={{ x: '-100%' }}
               transition={TRANSITIONS.cinemaIn}
               className="fixed top-0 left-0 h-full w-[85vw] max-w-sm glass-panel z-[2001] p-8 overflow-y-auto"
               data-lenis-prevent
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
                            const isSelected = pendingTypes.includes(type);
                            const availabilityCount = getAvailabilityCount('type', type, { shapes: pendingShapes, types: pendingTypes, colors: pendingColors, themes: pendingThemes });
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

                    {/* Frame Shape Filter */}
                    <div>
                       <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Frame Shape</h4>
                       <div className="grid grid-cols-3 gap-3">
                          {['Round', 'Square', 'Cat Eye', 'Aviator', 'Rectangle'].map(shape => {
                             const Icon = FrameIcons[shape] || FrameIcons.Rectangle;
                             const isSelected = pendingShapes.includes(shape);
                             const availabilityCount = getAvailabilityCount('shape', shape, { shapes: pendingShapes, types: pendingTypes, colors: pendingColors, themes: pendingThemes, categories: pendingCategories, materials: pendingMaterials, priceRange: [pendingMinPrice, pendingMaxPrice] });
                             const label = shape === 'Cat Eye' ? 'Cat-Eye' : shape;
                             return (
                                 <div key={shape} className="flex flex-col items-center">
                                    <button
                                       key={shape}
                                       onClick={() => handleShapeChange(shape)}
                                       disabled={availabilityCount === 0 && !isSelected}
                                       className={`w-full aspect-[4/3] flex items-center justify-center border-2 rounded-xl transition-all duration-300 ${isSelected ? 'border-primary bg-primary text-white scale-[1.02]' : 'border-divider bg-white text-secondary'} ${availabilityCount === 0 && !isSelected ? 'opacity-30' : ''}`}
                                    >
                                       <div className={`scale-90 ${isSelected ? 'text-white' : 'text-slate-800'}`}><Icon /></div>
                                    </button>
                                    <span className="text-[9px] font-bold text-slate-700 mt-1 text-center truncate w-full">{label}</span>
                                    <span className="text-[8px] font-mono font-bold text-slate-400">({availabilityCount})</span>
                                 </div>
                             );
                          })}
                       </div>
                    </div>

                    {/* Color Filter */}
                    <div>
                       <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Color</h4>
                       <div className="grid grid-cols-3 gap-3">
                          {colorOptions.map(color => {
                             const isSelected = pendingColors.includes(color);
                             const availabilityCount = getAvailabilityCount('color', color, { shapes: pendingShapes, types: pendingTypes, colors: pendingColors, themes: pendingThemes, categories: pendingCategories, materials: pendingMaterials, priceRange: [pendingMinPrice, pendingMaxPrice] });
                             return (
                                 <div key={color} className="flex flex-col items-center">
                                    <button
                                       key={color}
                                       onClick={() => handleColorChange(color)}
                                       disabled={availabilityCount === 0 && !isSelected}
                                       className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2 scale-105' : 'hover:scale-105'} ${availabilityCount === 0 && !isSelected ? 'opacity-30' : ''}`}
                                    >
                                       <ColorSwatch color={color} isSelected={false} size="w-full h-full" products={products} />
                                    </button>
                                    <span className="text-[9px] font-bold text-slate-700 mt-1 text-center truncate w-full">{color}</span>
                                    <span className="text-[8px] font-mono font-bold text-slate-400">({availabilityCount})</span>
                                 </div>
                             );
                          })}
                       </div>
                    </div>

                    {/* Material Filter */}
                    <div>
                       <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Material</h4>
                       <div className="space-y-3">
                          {['Acetate', 'Metal', 'Titanium', 'Plastic', 'TR90'].map(mat => {
                             const isChecked = pendingMaterials.includes(mat);
                             const handleToggle = () => {
                                 setPendingMaterials(prev =>
                                     prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]
                                 );
                             };
                             const availabilityCount = getAvailabilityCount('material', mat, { shapes: pendingShapes, types: pendingTypes, colors: pendingColors, themes: pendingThemes, categories: pendingCategories, materials: pendingMaterials, priceRange: [pendingMinPrice, pendingMaxPrice] });
                             return (
                                 <label key={mat} className="flex items-center gap-3 cursor-pointer group py-1">
                                     <input
                                         type="checkbox"
                                         checked={isChecked}
                                         onChange={handleToggle}
                                         className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                     />
                                     <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                                         {mat} <span className="text-[10px] text-slate-400 font-normal">({availabilityCount})</span>
                                     </span>
                                 </label>
                             );
                          })}
                       </div>
                    </div>

                     {/* Accessory Type Filter (mobile) - shown only on accessories route */}
                     {isAccessoriesRoute && (
                       <div>
                         <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Accessory Type</h4>
                         <div className="space-y-3">
                           {ACCESSORY_TYPE_OPTIONS.map(at => {
                             const isChecked = pendingAccessoryTypes.includes(at);
                             return (
                               <label key={at} className="flex items-center gap-3 cursor-pointer group py-1">
                                 <input
                                   type="checkbox"
                                   checked={isChecked}
                                   onChange={() => setPendingAccessoryTypes(prev =>
                                     prev.includes(at) ? prev.filter(a => a !== at) : [...prev, at]
                                   )}
                                   className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                 />
                                 <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{at}</span>
                               </label>
                             );
                           })}
                         </div>
                       </div>
                     )}

                    {/* Price Range Filter */}
                    <div>
                       <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-secondary mb-6 border-b border-divider pb-2">Price Range</h4>
                       <div className="pt-2 pb-4 space-y-4">
                          <div className="relative h-1 w-[90%] mx-auto bg-slate-100 rounded-full my-4">
                              <div
                                  className="absolute h-full bg-[#B78A5B] rounded-full"
                                  style={{
                                      left: `${(pendingMinPrice / 20000) * 100}%`,
                                      right: `${100 - (pendingMaxPrice / 20000) * 100}%`
                                  }}
                              />
                              <input
                                  type="range"
                                  min="0"
                                  max="20000"
                                  step="500"
                                  value={pendingMinPrice}
                                  onChange={handleMinChange}
                                  className="absolute w-full h-1 pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#B78A5B] [&::-webkit-slider-thumb]:appearance-none"
                              />
                              <input
                                  type="range"
                                  min="0"
                                  max="20000"
                                  step="500"
                                  value={pendingMaxPrice}
                                  onChange={handleMaxChange}
                                  className="absolute w-full h-1 pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#B78A5B] [&::-webkit-slider-thumb]:appearance-none"
                              />
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 text-center">
                                  ₹{pendingMinPrice.toLocaleString()}
                              </div>
                              <span className="text-slate-400 font-bold">-</span>
                              <div className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 text-center">
                                  ₹{pendingMaxPrice.toLocaleString()}
                              </div>
                          </div>
                       </div>
                    </div>
                </div>

                   <button
                     onClick={handleApplyFilters}
                     className="w-full bg-primary text-white py-6 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl"
                   >
                     Show Results ({filteredProducts.length})
                   </button>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Filter Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] mb-2 pointer-events-auto">
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
