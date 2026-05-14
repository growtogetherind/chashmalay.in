import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Zap, Droplets, Heart, Share2, Star,
  ChevronRight, ChevronLeft, Plus, Minus, Info,
  ArrowRight, CheckCircle2, AlertCircle, HelpCircle,
  FileText, PenLine, ShieldAlert, UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductById, subscribeProducts } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ui/ProductCard';
import { FadeIn, TRANSITIONS } from '../components/ui/Motion';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const ContactLensDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [prescriptionType, setPrescriptionType] = useState('manual');
  const [selectedColor, setSelectedColor] = useState('');
  
  const [powers, setPowers] = useState({
    leftSph: '',
    rightSph: '',
    leftCyl: '0.00',
    rightCyl: '0.00',
    leftAxis: '0',
    rightAxis: '0'
  });

  const sphPowers = React.useMemo(() => Array.from({ length: 81 }, (_, i) => (-10 + i * 0.25).toFixed(2)).map(v => v > 0 ? `+${v}` : v), []);
  const cylPowers = React.useMemo(() => Array.from({ length: 25 }, (_, i) => (-6 + i * 0.25).toFixed(2)).map(v => v > 0 ? `+${v}` : v), []);
  const axisValues = React.useMemo(() => Array.from({ length: 181 }, (_, i) => i.toString()), []);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await getProductById(id);
      if (error || !data) {
        toast.error("Product not found");
        navigate('/contact-lenses');
        return;
      }
      setProduct(data);
      setLoading(false);

      // Fetch related products
      const unsub = subscribeProducts({ category: data.category }, (items) => {
        setRelatedProducts(items.filter(p => p.id !== id).slice(0, 4));
      });
      return () => unsub();
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const images = [
    product.images?.front,
    product.images?.side,
    product.images?.packaging || product.images?.zoom,
    ... (product.images?.gallery || [])
  ].filter(Boolean);

  const price = Number(product.price || 0);
  const originalPrice = Number(product.original_price || price * 1.2);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  const reviews = product.reviews || [];
  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) : (product.rating || 4.8);

  const handleAddToCart = () => {
    if (prescriptionType === 'manual' && (!powers.leftSph || !powers.rightSph)) {
      toast.error("Please select your power details");
      return;
    }

    // Structure lensSelection to match CartContext sanitizer schema
    const lensSelection = {
      visionType: null,
      lensPackage: null,
      powerOption: prescriptionType,
      selectedColor: selectedColor || null,
      manualDetails: prescriptionType === 'manual' ? {
        leftSph: powers.leftSph,
        rightSph: powers.rightSph,
        leftCyl: powers.leftCyl,
        rightCyl: powers.rightCyl,
        leftAxis: powers.leftAxis,
        rightAxis: powers.rightAxis,
      } : null,
      prescriptionUrl: null,
      isContactLens: true,
    };

    addToCart(product, lensSelection);
    toast.success("Added to Cart!");
    navigate('/cart');
  };

  return (
    <div className="product-detail-page pt-28">
      <div className="container mx-auto px-4 md:px-8">
        <div className="product-detail-layout">
          {/* Left: Gallery */}
          <div className="gallery-section">
            <div className="gallery-container">
              <div className="vertical-thumbnails">
                {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    className={`thumb-btn ${activeImage === idx ? 'active' : ''}`}
                    onClick={() => setActiveImage(idx)}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="main-image-viewport">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={images[activeImage]}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={TRANSITIONS.cinema}
                    className="w-full h-full object-contain p-12"
                  />
                </AnimatePresence>
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <button onClick={() => setIsWishlisted(!isWishlisted)} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-slate-400 hover:text-red-500'}`}>
                    <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white text-slate-400 flex items-center justify-center shadow-xl hover:text-emerald-500 transition-all">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="product-info-section sticky-sidebar">
            <FadeIn>
              <div className="brand-badge text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-4 bg-emerald-50 w-fit px-4 py-1.5 rounded-full border border-emerald-100">
                {product.brand}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4 uppercase">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(avgRating) ? "currentColor" : "none"} />)}
                  </div>
                  <span className="text-sm font-black text-slate-900">{avgRating}</span>
                </div>
                <div className="h-4 w-px bg-slate-200"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{reviews.length} Reviews</span>
              </div>

              <div className="price-stack mb-10">
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">₹{price.toLocaleString()}</span>
                  <span className="text-lg text-slate-400 line-through font-bold">₹{originalPrice.toLocaleString()}</span>
                  <div className="bg-red-50 text-red-600 text-[11px] font-black px-3 py-1 rounded-full border border-red-100">
                    {discountPercent}% OFF
                  </div>
                </div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Inclusive of all taxes</p>
              </div>

              {/* Prescription Selection */}
              <div className="prescription-selector mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Vision Protocol</h3>
                  <button className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                    <HelpCircle size={14} /> Power Guide
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <button
                    onClick={() => setPrescriptionType('manual')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
                      prescriptionType === 'manual'
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:text-primary hover:bg-slate-50'
                    }`}
                  >
                    <PenLine size={20} />
                    <span>Enter Manually</span>
                  </button>
                  <button
                    onClick={() => setPrescriptionType('upload')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
                      prescriptionType === 'upload'
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-primary/30 hover:text-primary hover:bg-slate-50'
                    }`}
                  >
                    <UploadCloud size={20} />
                    <span>Upload Prescription</span>
                  </button>
                </div>

                {prescriptionType === 'manual' ? (
                  <div className="space-y-6 animate-fade-in">
                    {/* Left Eye */}
                    <div className="eye-grid">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Left Eye (OS)</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="select-wrapper">
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">SPH</label>
                          <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none w-full" value={powers.leftSph} onChange={e => setPowers({...powers, leftSph: e.target.value})}>
                            <option value="">Select</option>
                            {sphPowers.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="select-wrapper">
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">CYL</label>
                          <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none w-full" value={powers.leftCyl} onChange={e => setPowers({...powers, leftCyl: e.target.value})}>
                            {cylPowers.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="select-wrapper">
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">AXIS</label>
                          <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none w-full" value={powers.leftAxis} onChange={e => setPowers({...powers, leftAxis: e.target.value})}>
                            {axisValues.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Right Eye */}
                    <div className="eye-grid">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Right Eye (OD)</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="select-wrapper">
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">SPH</label>
                          <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none w-full" value={powers.rightSph} onChange={e => setPowers({...powers, rightSph: e.target.value})}>
                            <option value="">Select</option>
                            {sphPowers.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="select-wrapper">
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">CYL</label>
                          <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none w-full" value={powers.rightCyl} onChange={e => setPowers({...powers, rightCyl: e.target.value})}>
                            {cylPowers.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="select-wrapper">
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block">AXIS</label>
                          <select className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none w-full" value={powers.rightAxis} onChange={e => setPowers({...powers, rightAxis: e.target.value})}>
                            {axisValues.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="upload-section animate-fade-in">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all group">
                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                         <UploadCloud size={32} className="text-slate-300 group-hover:text-emerald-500 mb-2 transition-colors" />
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Click to upload image</p>
                       </div>
                       <input type="file" className="hidden" />
                    </label>
                    <p className="mt-4 text-[9px] font-bold text-center text-slate-400 uppercase tracking-widest leading-relaxed">
                      Don't have a prescription? <span className="text-emerald-600 cursor-pointer hover:underline">Need Eye Power Check?</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="quantity-section mb-10">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">Pack Quantity</h3>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1 shadow-inner">
                       <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 transition-all">
                          <Minus size={16} />
                       </button>
                       <span className="w-12 text-center font-black text-slate-900">{quantity}</span>
                       <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 transition-all">
                          <Plus size={16} />
                       </button>
                    </div>
                    <div className="flex-grow bg-slate-50 rounded-2xl px-6 py-4 border border-slate-100">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Total Quantity</span>
                       <span className="text-sm font-black text-slate-900">{quantity * Number(product.pack_size?.split(' ')[0] || 6)} Lenses</span>
                    </div>
                 </div>
              </div>

              {/* Color Selection */}
              {(() => {
                const colorList = [
                  ...(Array.isArray(product.available_colors) ? product.available_colors : []),
                  ...(Array.isArray(product.colors) ? product.colors : []),
                  product.contact_lens_color,
                  product.color,
                ].filter(Boolean).map(c => (typeof c === 'string' ? c : c.name || c.label || '')).filter(Boolean);
                const uniqueColors = [...new Set(colorList)];
                if (uniqueColors.length === 0) return null;
                return (
                  <div className="color-section mb-10">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">Lens Color</h3>
                    <div className="flex flex-wrap gap-3">
                      {uniqueColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                          className={`px-5 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                            selectedColor === color
                              ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                              : 'border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary hover:bg-slate-50'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="action-stack space-y-4 mb-12">
                <button 
                  onClick={() => handleAddToCart()} 
                  className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.35em] hover:bg-black transition-all shadow-2xl shadow-slate-900/30"
                >
                  Add to Cart
                </button>
              </div>

              {/* Trust elements */}
              <div className="grid grid-cols-3 gap-y-8 gap-x-4 py-8 border-t border-slate-100">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><ShieldCheck size={24} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">100% Original</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><CheckCircle2 size={24} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">ISO Certified</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600"><Zap size={24} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600"><Share2 size={24} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">Easy Replace</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600"><ArrowRight size={24} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600"><Plus size={24} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">Doctor Rec.</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="product-details-extended py-24 space-y-24">
          {/* Spec Table */}
          <section>
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-12 flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center"><Info size={24} /></span>
                Technical Specifications
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100">
                   <table className="w-full">
                      <tbody className="divide-y divide-slate-200">
                         <tr className="group"><td className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Lens Type</td><td className="py-5 text-sm font-black text-slate-900 text-right">{product.contact_lens_type}</td></tr>
                         <tr className="group"><td className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Material</td><td className="py-5 text-sm font-black text-slate-900 text-right">{product.material || 'Silicone Hydrogel'}</td></tr>
                         <tr className="group"><td className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Water Content</td><td className="py-5 text-sm font-black text-slate-900 text-right">{product.water_content || '38%'}</td></tr>
                         <tr className="group"><td className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Diameter (DIA)</td><td className="py-5 text-sm font-black text-slate-900 text-right">{product.diameter || '14.2mm'}</td></tr>
                         <tr className="group"><td className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Base Curve (BC)</td><td className="py-5 text-sm font-black text-slate-900 text-right">{product.base_curve || '8.6mm'}</td></tr>
                      </tbody>
                   </table>
                </div>
                <div className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100">
                   <table className="w-full">
                      <tbody className="divide-y divide-slate-200">
                         <tr className="group"><td className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">UV Protection</td><td className="py-5 text-sm font-black text-slate-900 text-right">{product.uv_protection || 'Yes'}</td></tr>
                         <tr className="group"><td className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Lens Color</td><td className="py-5 text-sm font-black text-slate-900 text-right">{product.contact_lens_color || 'Clear'}</td></tr>
                         <tr className="group"><td className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Usage Duration</td><td className="py-5 text-sm font-black text-slate-900 text-right">{product.disposable_type}</td></tr>
                         <tr className="group"><td className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Pack Size</td><td className="py-5 text-sm font-black text-slate-900 text-right">{product.pack_size}</td></tr>
                      </tbody>
                   </table>
                </div>
             </div>
          </section>

          {/* Description */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
             <div className="relative">
                <div className="aspect-square bg-slate-50 rounded-[60px] overflow-hidden">
                   <img src={images[0]} alt="Product" className="w-full h-full object-contain p-20" />
                </div>
                <div className="absolute -bottom-10 -right-10 bg-emerald-600 text-white p-10 rounded-[40px] shadow-2xl max-w-[280px]">
                   <Droplets size={40} className="mb-4" />
                   <h4 className="text-xl font-black mb-2">High Breathability</h4>
                   <p className="text-xs font-medium opacity-80 leading-relaxed">Engineered with advanced Silicone Hydrogel for maximum oxygen flow.</p>
                </div>
             </div>
             <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-8 leading-tight">PREMIUM VISION,<br />MAXIMUM COMFORT.</h2>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0"><ShieldCheck size={20} /></div>
                      <div>
                         <h5 className="text-sm font-black text-slate-900 uppercase mb-1">Dry Eye Support</h5>
                         <p className="text-xs text-slate-500 leading-relaxed">Maintains moisture throughout the day, ideal for long screen hours and digital eye strain.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0"><Zap size={20} /></div>
                      <div>
                         <h5 className="text-sm font-black text-slate-900 uppercase mb-1">UV Protection Protocol</h5>
                         <p className="text-xs text-slate-500 leading-relaxed">Integrated UV blocking technology to shield your eyes from harmful ultraviolet radiation.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0"><CheckCircle2 size={20} /></div>
                      <div>
                         <h5 className="text-sm font-black text-slate-900 uppercase mb-1">HD Optical Clarity</h5>
                         <p className="text-xs text-slate-500 leading-relaxed">Advanced surface design provides sharp vision even in low light conditions.</p>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Safety Instructions */}
          <section className="bg-slate-900 rounded-[60px] p-12 md:p-20 text-white relative overflow-hidden">
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-20">
                <div>
                   <h2 className="text-3xl font-black mb-8 flex items-center gap-4">
                      <ShieldAlert size={32} className="text-rose-500" />
                      SAFETY PROTOCOL
                   </h2>
                   <div className="space-y-8">
                      <div className="flex gap-6 group">
                         <span className="text-4xl font-black text-white/10 group-hover:text-emerald-500/30 transition-colors">01</span>
                         <p className="text-sm font-bold tracking-wide leading-relaxed">Wash and dry your hands thoroughly before handling the lenses.</p>
                      </div>
                      <div className="flex gap-6 group">
                         <span className="text-4xl font-black text-white/10 group-hover:text-emerald-500/30 transition-colors">02</span>
                         <p className="text-sm font-bold tracking-wide leading-relaxed">Do not sleep with your lenses unless specifically advised by your doctor.</p>
                      </div>
                      <div className="flex gap-6 group">
                         <span className="text-4xl font-black text-white/10 group-hover:text-emerald-500/30 transition-colors">03</span>
                         <p className="text-sm font-bold tracking-wide leading-relaxed">Replace your lenses according to the prescribed usage duration.</p>
                      </div>
                   </div>
                </div>
                <div className="space-y-8 pt-0 md:pt-16">
                   <div className="flex gap-6 group">
                      <span className="text-4xl font-black text-white/10 group-hover:text-emerald-500/30 transition-colors">04</span>
                      <p className="text-sm font-bold tracking-wide leading-relaxed">Store your lenses in fresh lens solution every time you remove them.</p>
                   </div>
                   <div className="flex gap-6 group">
                      <span className="text-4xl font-black text-white/10 group-hover:text-emerald-500/30 transition-colors">05</span>
                      <p className="text-sm font-bold tracking-wide leading-relaxed">Immediately stop use and consult an eye professional if irritation occurs.</p>
                   </div>
                   <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 mt-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">Professional Advice</p>
                      <p className="text-xs font-medium opacity-70 leading-relaxed">Regular eye examinations are essential for the health of your eyes and the comfort of your contact lenses.</p>
                   </div>
                </div>
             </div>
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          </section>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-24 border-t border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-12">Similar Objects</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ContactLensDetail;
