import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, Heart, Share2, MapPin, Box, RotateCcw, 
  ShieldCheck, ChevronDown, ChevronUp, Map, Eye, Search, Layers,
  ChevronRight, ChevronLeft, User
} from 'lucide-react';
import { getProductById, getProducts } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ui/ProductCard';
import LensSelector from '../components/ui/LensSelector';
import { FadeIn, TRANSITIONS } from '../components/ui/Motion';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="detail-accordion">
      <button className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{title}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="accordion-content">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [activeSize, setActiveSize] = useState('M');
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Functional States
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null); // 'checking', 'success', 'error'
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await getProductById(id);
      if (!error && data) {
        data.colors = data.colors || [];
        data.gallery = Array.from(new Set([...(data.gallery || []), data.frame_image, data.model_image])).filter(Boolean);
        setProduct(data);
        const { data: allProds } = await getProducts({ category: data.category });
        if (allProds) setRelatedProducts(allProds.filter(p => p.id !== data.id).slice(0, 10));
      }
      setLoading(false);
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const wishlist = JSON.parse(localStorage.getItem('chashmaly_wishlist') || '[]');
    setIsWishlisted(wishlist.includes(product.id));
  }, [product]);

  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('chashmaly_wishlist') || '[]');
    const exists = wishlist.includes(product.id);
    const updated = exists ? wishlist.filter(item => item !== product.id) : [...wishlist, product.id];
    localStorage.setItem('chashmaly_wishlist', JSON.stringify(updated));
    setIsWishlisted(!exists);
    toast.success(exists ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleShare = async () => {
    const shareData = { title: product.name, text: `Check out ${product.name} on Chashmaly!`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const checkPincode = () => {
    if (!pincode || pincode.length !== 6) {
      setPincodeStatus('error');
      return;
    }
    setPincodeStatus('checking');
    setTimeout(() => {
      setPincodeStatus('success');
    }, 1000);
  };

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const nextImage = () => setActiveImage((prev) => (prev + 1) % product.gallery.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + product.gallery.length) % product.gallery.length);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product Not Found.</div>;

  const price = parseInt((product.consumersPrice || product.price || "0").toString().replace(/,/g, ''));
  const originalPrice = product.originalPrice ? parseInt(product.originalPrice.toString().replace(/,/g, '')) : Math.round(price * 1.3);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  // Dynamic Rating Stats
  const reviews = product.reviews || [];
  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) : product.rating || '4.8';
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => Math.round(r.rating) === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : (star === 5 ? 85 : star === 4 ? 10 : 2);
    return { star, percentage, count };
  });

  return (
    <div className="product-detail-page pt-28">
      <div className="container">
        <div className="product-detail-layout">
          
          {/* Left Column: Gallery & Content Sections */}
          <div className="space-y-12">
            <div className="gallery-container">
              {/* Vertical Thumbnails */}
              <div className="vertical-thumbnails">
                {product.gallery.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`thumb-btn ${activeImage === idx ? 'active' : ''}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
                {product.gallery.length > 5 && (
                   <div className="thumb-btn bg-black flex items-center justify-center text-[8px] text-white font-bold">+{product.gallery.length - 5}</div>
                )}
              </div>

              {/* Main Image Viewport */}
              <div className="main-image-viewport group">
                <div className="absolute top-4 right-4 bg-white/80 px-2 py-1 rounded text-[10px] font-bold text-teal-600 border border-teal-100 flex items-center gap-1 z-10">
                  {avgRating} <Star size={8} fill="currentColor" /> | {reviews.length || '385'}
                </div>
                
                {/* Navigation Arrows */}
                <button className="image-nav-btn prev opacity-0 group-hover:opacity-100" onClick={prevImage}><ChevronLeft size={16} /></button>
                <button className="image-nav-btn next opacity-0 group-hover:opacity-100" onClick={nextImage}><ChevronRight size={16} /></button>

                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImage}
                    src={product.gallery[activeImage]} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[85%] h-auto object-contain"
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* Content Sections (Actions removed by previous user request) */}
          </div>

          {/* Right Column: Sticky Sidebar */}
          <aside className="sticky-sidebar">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-xl font-bold text-[#1a1a1a] mb-1">{product.name}</h1>
                <p className="text-xs text-[#666] font-medium">{product.brand || 'Signature Series'} • {product.frame_shape || 'Square'}</p>
              </div>
              <div className="flex gap-3">
                 <button className="hover:scale-110 transition-transform" onClick={toggleWishlist}>
                   <Heart size={20} fill={isWishlisted ? 'red' : 'none'} color={isWishlisted ? 'red' : '#1a1a1a'} />
                 </button>
                 <button className="hover:scale-110 transition-transform" onClick={handleShare}><Share2 size={20} /></button>
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-1">
               <span className="text-2xl font-bold text-[#1a1a1a]">₹{price.toLocaleString()}</span>
               <span className="text-xs text-[#666]">with Free Lenses</span>
            </div>
            <div className="text-[10px] font-bold text-teal-600 mb-6 flex items-center gap-1">
               <div className="flex text-yellow-400"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
               ({discountPercent}% OFF)
            </div>

            {/* Frame Color */}
            <div className="mb-6">
               <p className="text-[11px] font-bold mb-3 uppercase tracking-wider text-[#1a1a1a]">Frame Color: <span className="font-medium text-[#666] ml-1">{product.colors[activeColor]?.name || 'Standard'}</span></p>
                <div className="flex gap-3">
                  {product.colors && product.colors.length > 0 ? product.colors.map((c, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        setActiveColor(i);
                        if (c.image) {
                          const idx = product.gallery.findIndex(img => img === c.image);
                          if (idx !== -1) setActiveImage(idx);
                        }
                      }}
                      className={`w-8 h-8 rounded-full border-2 p-0.5 transition-all ${activeColor === i ? 'border-primary' : 'border-transparent'}`}
                    >
                       <div className="w-full h-full rounded-full border border-black/10" style={{ background: c.hex }} title={c.name} />
                    </button>
                  )) : (
                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-primary p-0.5"><div className="w-full h-full rounded-full border border-black/10" /></div>
                  )}
               </div>
               {activeColor === 0 && <span className="text-[9px] text-red-600 font-bold mt-2 block">Few Left</span>}
            </div>

            {/* Frame Size */}
            <div className="mb-8">
               <p className="text-[11px] font-bold mb-3 uppercase tracking-wider text-[#1a1a1a]">Frame Size: <span className="font-medium text-[#666] ml-1">{activeSize}</span></p>
               <div className="size-btn-group">
                  {['S', 'M', 'L'].map(size => (
                    <button 
                      key={size}
                      onClick={() => setActiveSize(size)}
                      className={`size-pill ${activeSize === size ? 'active' : ''}`}
                    >
                      {size}
                    </button>
                  ))}
               </div>
            </div>

            {/* Desktop Action Button */}
            <button 
              onClick={() => setIsLensModalOpen(true)} 
              className="sidebar-cta-btn"
            >
              Select Lenses
            </button>

            {/* Delivery Details */}
            <div className="mb-8">
               <p className="text-[11px] font-bold mb-3 uppercase tracking-wider text-[#1a1a1a]">Delivery Details</p>
               <div className="pincode-box">
                  <input 
                    type="text" 
                    placeholder="Enter pincode" 
                    className="pincode-input"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button className="pincode-btn" onClick={checkPincode} disabled={pincodeStatus === 'checking'}>
                    {pincodeStatus === 'checking' ? '...' : 'Check'}
                  </button>
               </div>
               {pincodeStatus === 'success' && <p className="delivery-status-msg success">Deliverable to your location! Estimated: 2-3 Days</p>}
               {pincodeStatus === 'error' && <p className="delivery-status-msg error">Please enter a valid 6-digit pincode.</p>}
               
               <div className="delivery-check-card">
                  <MapPin size={18} className="text-teal-600" />
                  <div>
                    <p className="text-[10px] font-bold text-[#1a1a1a]">Check delivery details</p>
                    <p className="text-[9px] text-[#666]">Express delivery might be applicable</p>
                  </div>
               </div>
            </div>

            {/* Trust Section */}
            <div className="mb-8">
               <p className="text-[11px] font-bold mb-4 uppercase tracking-wider text-[#1a1a1a]">We Assure you</p>
               <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-2"><RotateCcw size={18} className="text-green-600" /></div>
                    <p className="text-[8px] font-bold leading-tight">No Questions Asked Returns</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-2"><Layers size={18} className="text-green-600" /></div>
                    <p className="text-[8px] font-bold leading-tight">Easy 14-day Exchange</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-2"><ShieldCheck size={18} className="text-green-600" /></div>
                    <p className="text-[8px] font-bold leading-tight">365-day Warranty</p>
                  </div>
               </div>
            </div>

            {/* Reviews Summary */}
            <div className="review-summary-box">
               <div className="flex justify-between items-baseline mb-6">
                  <h3 className="text-sm font-bold text-[#1a1a1a]">Rating & Reviews</h3>
                  <div className="text-xs font-bold text-teal-600">{avgRating} <Star size={10} fill="currentColor" /></div>
               </div>
               
               <div className="flex gap-8 items-center mb-8">
                  <div className="text-center">
                     <p className="text-3xl font-bold">{avgRating} <Star size={18} className="inline mb-1" fill="currentColor" /></p>
                     <p className="text-[9px] text-[#666]">{reviews.length} Reviews</p>
                  </div>
                  <div className="flex-grow space-y-1">
                     {ratingDistribution.map(({ star, percentage }) => (
                       <div key={star} className="rating-row">
                          <span className="text-[9px] w-2">{star}</span>
                          <div className="rating-bar-container">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${percentage}%` }}
                              viewport={{ once: true }}
                              className="rating-bar-fill" 
                            />
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               {reviews.length > 0 && (
                 <>
                   <p className="text-[10px] font-bold mb-3">User Photos</p>
                   <div className="user-photos-strip">
                      {reviews.slice(0, 5).map((rev, i) => rev.photoUrl && (
                        <div key={i} className="user-photo-thumb"><img src={rev.photoUrl} alt="" className="w-full h-full object-cover" /></div>
                      ))}
                      {/* Fallback photos if none */}
                      <div className="user-photo-thumb"><img src={product.model_image} alt="" className="w-full h-full object-cover opacity-50" /></div>
                   </div>

                   <div className="space-y-4 mb-6">
                      {reviews.slice(0, 3).map((rev, i) => (
                        <div key={i} className="py-3 border-b border-divider">
                           <div className="flex justify-between items-center mb-1">
                              <p className="text-[10px] font-bold flex items-center gap-2"><User size={10} /> {rev.full_name || 'Verified Buyer'}</p>
                              <span className="text-[9px] font-bold">{rev.rating} <Star size={8} fill="currentColor" className="inline" /></span>
                           </div>
                           <p className="text-[9px] text-[#666] mb-1">{rev.created_at ? new Date(rev.created_at.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
                           <p className="text-[10px] text-[#1a1a1a]">{rev.comment}</p>
                        </div>
                      ))}
                   </div>
                   <button className="w-full py-2 border border-black rounded text-[10px] font-bold">Read All Reviews</button>
                 </>
               )}
            </div>

            {/* Accordions */}
            <Accordion title="Frequently asked questions">
               <div className="space-y-4">
                  <p><strong>How do I know my frame size?</strong><br/>You can check our frame size guide or use our virtual try-on feature.</p>
                  <p><strong>What is the return policy?</strong><br/>We offer a no-questions-asked 14-day return and exchange policy.</p>
               </div>
            </Accordion>
            <Accordion title="Product Details">
               <div className="grid grid-cols-2 gap-y-4">
                  <div><p className="text-[10px] text-[#666]">Frame Type</p><p className="text-[10px] font-bold">{product.frame_type || 'Full Rim'}</p></div>
                  <div><p className="text-[10px] text-[#666]">Material</p><p className="text-[10px] font-bold">{product.material || 'Acetate'}</p></div>
                  <div><p className="text-[10px] text-[#666]">Weight</p><p className="text-[10px] font-bold">24 gm</p></div>
                  <div><p className="text-[10px] text-[#666]">Shape</p><p className="text-[10px] font-bold">{product.frame_shape || 'Rectangle'}</p></div>
               </div>
            </Accordion>
          </aside>
        </div>

        {/* Similar Products Section */}
        <section className="mt-32 pt-16 border-t border-divider">
           <div className="flex justify-between items-end mb-12">
              <h2 className="text-2xl font-bold text-[#1a1a1a]">Similar Products</h2>
              <div className="flex gap-4">
                 <button className="w-10 h-10 rounded-full border border-divider flex items-center justify-center hover:bg-surface-flat" onClick={() => scrollSlider('left')}><ChevronLeft size={20} /></button>
                 <button className="w-10 h-10 rounded-full border border-divider flex items-center justify-center hover:bg-surface-flat" onClick={() => scrollSlider('right')}><ChevronRight size={20} /></button>
              </div>
           </div>
           <div className="similar-grid-container" ref={sliderRef}>
              {relatedProducts.map(p => (
                <div key={p.id} className="w-full">
                  <ProductCard product={p} />
                </div>
              ))}
           </div>
        </section>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="pdp-sticky-cta">
         <button onClick={() => setIsLensModalOpen(true)} className="cta-main-btn">Select Lenses</button>
      </div>

      <LensSelector 
        isOpen={isLensModalOpen} 
        onClose={() => setIsLensModalOpen(false)}
        product={product}
      />
    </div>
  );
};

export default ProductDetail;
