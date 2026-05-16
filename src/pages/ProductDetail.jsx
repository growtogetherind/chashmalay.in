import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  Star, Heart, Share2, MapPin, Box, RotateCcw,
  ShieldCheck, ChevronDown, ChevronUp, Map, Eye, Search, Layers,
  ChevronRight, ChevronLeft, User, X, CheckCircle
} from 'lucide-react';
import { getProductById, getProducts, addReview, subscribeProductReviews } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ui/ProductCard';
import LensSelector from '../components/ui/LensSelector';
import ContactLensSelector from '../components/ui/ContactLensSelector';
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
  const [imageLoading, setImageLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [activeSize, setActiveSize] = useState('M');
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);
  const [isCLModalOpen, setIsCLModalOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Review States
  const [realTimeReviews, setRealTimeReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await getProductById(id);
      if (!error && data) {
        data.colors = data.colors || [];
        const newGallery = data.images?.gallery || [];
        const singleImages = [
          data.images?.front,
          data.images?.side,
          data.images?.model,
          data.images?.zoom,
          data.frame_image,
          data.model_image
        ].filter(Boolean);
        const colorImages = (data.colors || []).map(c => c.image).filter(Boolean);
        data.gallery = Array.from(new Set([...singleImages, ...newGallery, ...colorImages])).filter(Boolean);
        setProduct(data);
        const { data: allProds } = await getProducts({ category: data.category });
        if (allProds) setRelatedProducts(allProds.filter(p => p.id !== data.id).slice(0, 10));
      }
      setLoading(false);
    };
    fetchProduct();
    
    const unsubscribeReviews = subscribeProductReviews(id, (data) => {
      setRealTimeReviews(data || []);
    }, (err) => console.error("Review sync error:", err));

    window.scrollTo(0, 0);
    return () => {
      unsubscribeReviews();
    };
  }, [id]);

  useEffect(() => {
    setImageLoading(true);
  }, [activeImage]);

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

  const nextImage = () => setActiveImage((prev) => (prev + 1) % product.gallery.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + product.gallery.length) % product.gallery.length);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to write a review'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a comment'); return; }

    setSubmittingReview(true);
    const userInfo = { full_name: user.displayName || 'Anonymous Customer', product_name: product.name };
    const { error } = await addReview(product.id, user.uid, reviewForm.rating, reviewForm.comment, userInfo);

    if (error) {
      toast.error('Failed to submit review');
    } else {
      toast.success('Review submitted for approval.');
      setIsReviewModalOpen(false);
      setReviewForm({ rating: 5, comment: '' });
    }
    setSubmittingReview(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product Not Found.</div>;

  const price = parseInt((product.consumersPrice || product.price || "0").toString().replace(/,/g, ''));
  const originalPrice = product.original_price || product.originalPrice ? parseInt((product.original_price || product.originalPrice).toString().replace(/,/g, '')) : Math.round(price * 1.3);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  
  // Use real-time reviews for counts and ratings
  const reviews = realTimeReviews.length > 0 ? realTimeReviews : (product.reviews || []);
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) 
    : 0; // Remove demo 4.8 fallback
  const isContactLens = product.category?.toLowerCase().includes('contact') || product.category?.toLowerCase() === 'contacts';

  return (
    <div className="product-detail-page pt-28">
      <div className="container">
        <div className="product-detail-layout">

          <div className="space-y-12">
            <div className="gallery-container">
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
              </div>

              <div className="main-image-viewport group">
                <button className="image-nav-btn prev" onClick={prevImage}><ChevronLeft size={20} /></button>
                <button className="image-nav-btn next" onClick={nextImage}><ChevronRight size={20} /></button>

                <AnimatePresence mode="wait">
                  <div className="relative w-full h-full flex items-center justify-center min-h-[400px]">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                      </div>
                    )}
                    <motion.img
                      key={activeImage}
                      src={product.gallery[activeImage]}
                      onLoad={() => setImageLoading(false)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: imageLoading ? 0 : 1, scale: imageLoading ? 0.9 : 1 }}
                      transition={{ duration: 0.5, ease: TRANSITIONS.ease }}
                      className="w-full max-w-[90%] h-auto object-contain"
                    />
                  </div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <aside className="sticky-sidebar">
            <div className="flex flex-col gap-10">
              <div className="brand-header">
                <FadeIn delay={0.1}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                      {product.brand || 'Chashmaly Luxury'}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      ID: {product.sku || product.id?.slice(0, 8)}
                    </span>
                  </div>
                </FadeIn>

                <div className="flex justify-between items-start gap-4">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 leading-[1.1] mb-4">
                    {product.name}
                  </h1>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={toggleWishlist}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${isWishlisted ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900'}`}
                    >
                      <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                   <div className="flex items-center gap-4 mt-2">
                     {avgRating > 0 ? (
                       <>
                         <div className="flex items-center gap-1.5">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} fill={i < Math.floor(avgRating) ? "#EAB308" : "none"} className={i < Math.floor(avgRating) ? "text-yellow-500" : "text-slate-200"} />
                              ))}
                            </div>
                            <span className="text-[11px] font-black text-slate-900">{avgRating}</span>
                         </div>
                         <div className="w-px h-3 bg-slate-200" />
                       </>
                     ) : (
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">New Collection</span>
                     )}
                     <button onClick={() => setIsReviewModalOpen(true)} className="text-[11px] text-slate-500 font-black uppercase tracking-widest hover:text-accent transition-colors">
                       {reviews.length} Verified Reviews
                     </button>
                  </div>
              </div>

              <div className="pricing-section border-y border-slate-100 py-8">
                <div className="flex items-baseline gap-4 mb-3">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{price.toLocaleString()}</span>
                  {originalPrice > price && (
                    <span className="text-lg font-bold text-slate-300 line-through decoration-slate-300">₹{originalPrice.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      Save {discountPercent}% Today
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">Tax Included • Free Lens Kit</p>
                </div>
              </div>

              <div className="option-section">
                <div className="flex justify-between items-end mb-5">
                   <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                     Select Color
                   </label>
                   <span className="text-[11px] font-black text-slate-900">{(product.colors && product.colors.length > 0) ? product.colors[activeColor]?.name : 'Standard Edition'}</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {(product.colors && product.colors.length > 0) ? product.colors.map((c, i) => (
                    <button 
                      key={i} 
                      onClick={() => {
                        setActiveColor(i);
                        if (c.image) {
                          const galleryIdx = product.gallery.indexOf(c.image);
                          if (galleryIdx !== -1) setActiveImage(galleryIdx);
                        }
                      }} 
                      className={`relative w-14 h-14 rounded-full border-2 transition-all p-1.5 ${activeColor === i ? 'border-slate-900 scale-110 shadow-xl' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                      <div className="w-full h-full rounded-full border border-black/5" style={{ background: c.hex }} title={c.name} />
                      {activeColor === i && <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg"><CheckCircle size={10} /></div>}
                    </button>
                  )) : <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-slate-900 p-1.5 scale-110 shadow-lg"><div className="w-full h-full rounded-full" /></div>}
                </div>
              </div>

              <div className="option-section">
                <div className="flex justify-between items-center mb-5">
                  <label className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Select Size</label>
                  <button className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-0.5">Size Guide</button>
                </div>
                <div className="flex gap-4">
                  {(product.available_sizes || ['S', 'M', 'L']).map(size => (
                    <button key={size} onClick={() => setActiveSize(size)} className={`flex-1 py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] border-2 transition-all ${activeSize === size ? 'bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-900/20' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="action-stack space-y-4 pt-4">
                <button 
                  onClick={() => isContactLens ? setIsCLModalOpen(true) : setIsLensModalOpen(true)} 
                  className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.35em] hover:bg-black transition-all shadow-2xl shadow-slate-900/30 inline-cta-desktop"
                >
                  {isContactLens ? 'Configure Lenses' : 'Select Lenses'}
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-all">
                    <ShieldCheck size={20} className="text-slate-900" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">1 Year Warranty</span>
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed">Full coverage for manufacturing defects.</p>
                  </div>
                  <div className="flex flex-col gap-2 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-all">
                    <RotateCcw size={20} className="text-slate-900" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">14-Day Returns</span>
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed">Hassle-free exchange & refund policy.</p>
                  </div>
                </div>
              </div>

              <div className="logistics-box p-8 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                   <MapPin size={20} className="text-slate-900" />
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Check Delivery</h4>
                </div>
                <div className="relative group">
                  <input type="text" placeholder="Enter Pincode" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900 transition-all text-slate-900 placeholder:text-slate-300" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  <button onClick={checkPincode} disabled={pincodeStatus === 'checking'} className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                    {pincodeStatus === 'checking' ? '...' : 'Check'}
                  </button>
                </div>
                {pincodeStatus === 'success' && <FadeIn><div className="flex items-center gap-2 mt-6 text-emerald-600"><CheckCircle size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Express Delivery within 3-4 Days</span></div></FadeIn>}
              </div>

              <div className="specs-accordion space-y-4">
                <Accordion title="Technical Details">
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6 py-4 spec-grid-mobile">
                    {isContactLens ? (
                      <>
                        <div className="spec-item"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Disposable</span><p className="text-[12px] font-black text-slate-900">{product.disposable_type || 'Monthly'}</p></div>
                        <div className="spec-item"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Pack Size</span><p className="text-[12px] font-black text-slate-900">{product.pack_size || '6 Lenses'}</p></div>
                        <div className="spec-item"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Lens Color</span><p className="text-[12px] font-black text-slate-900">{product.contact_lens_color || 'Clear'}</p></div>
                        <div className="spec-item"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Type</span><p className="text-[12px] font-black text-slate-900">{product.contact_lens_type || 'Spherical'}</p></div>
                      </>
                    ) : (
                      <>
                        <div className="spec-item"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Material</span><p className="text-[12px] font-black text-slate-900">{product.frame_material || 'TR90 Ultra'}</p></div>
                        <div className="spec-item"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Style</span><p className="text-[12px] font-black text-slate-900">{product.frame_type || 'Full Rim'}</p></div>
                        <div className="spec-item"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Shape</span><p className="text-[12px] font-black text-slate-900">{product.frame_shape || 'Rectangle'}</p></div>
                        <div className="spec-item"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Weight</span><p className="text-[12px] font-black text-slate-900">22g (Featherlight)</p></div>
                      </>
                    )}
                  </div>
                </Accordion>
                <Accordion title="Protection Protocol">
                  <div className="space-y-4 py-4">
                    <div className="flex items-start gap-3">
                       <ShieldCheck size={16} className="text-slate-900 mt-0.5" />
                       <p className="text-[11px] font-bold text-slate-600 leading-relaxed"><strong>UV400 Shield</strong>: Maximum protection against UVA/UVB rays.</p>
                    </div>
                    <div className="flex items-start gap-3">
                       <Layers size={16} className="text-slate-900 mt-0.5" />
                       <p className="text-[11px] font-bold text-slate-600 leading-relaxed"><strong>Anti-Scratch Coating</strong>: Multi-layer protection for lens durability.</p>
                    </div>
                  </div>
                </Accordion>
                
                <Accordion title={`Reviews (${reviews.length})`}>
                  <div className="py-4 space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review, idx) => (
                        <div key={review.id || idx} className="review-card p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black uppercase">
                                {review.reviewer_name?.[0] || 'A'}
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-slate-900">{review.reviewer_name || 'Anonymous Customer'}</p>
                                <p className="text-[9px] text-slate-400 font-bold">{review.created_at?.toDate ? review.created_at.toDate().toLocaleDateString() : new Date().toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} fill={i < review.rating ? "#EAB308" : "none"} className={i < review.rating ? "text-yellow-500" : "text-slate-200"} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-slate-400 font-bold">No reviews yet. Be the first to review!</p>
                        <button onClick={() => setIsReviewModalOpen(true)} className="mt-2 text-[10px] font-black uppercase tracking-widest text-accent hover:underline">Write Review</button>
                      </div>
                    )}
                  </div>
                </Accordion>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-32 pt-16 border-t border-divider">
           <div className="flex justify-between items-end mb-12">
              <h2 className="text-2xl font-bold text-primary">Similar Products</h2>
           </div>
           <div className="similar-grid-container" ref={sliderRef}>
              {relatedProducts.map(p => <div key={p.id} className="w-full"><ProductCard product={p} /></div>)}
           </div>
        </section>
      </div>

      <div className="pdp-sticky-cta">
         <button onClick={() => isContactLens ? setIsCLModalOpen(true) : setIsLensModalOpen(true)} className="cta-main-btn">
           {isContactLens ? 'Configure Lenses' : 'Select Lenses'}
         </button>
      </div>

      <LensSelector isOpen={isLensModalOpen} onClose={() => setIsLensModalOpen(false)} product={product} />
      <ContactLensSelector isOpen={isCLModalOpen} onClose={() => setIsCLModalOpen(false)} product={product} />

      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[35px] w-full max-w-md overflow-hidden shadow-2xl relative">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900">Post Review</h3>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleReviewSubmit} className="p-8">
                <div className="mb-8 text-center">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Your Rating</label>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="hover:scale-110 transition-transform">
                        <Star size={32} fill={star <= reviewForm.rating ? '#FBBF24' : 'none'} color={star <= reviewForm.rating ? '#FBBF24' : '#E5E7EB'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-8">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Technical Feedback</label>
                  <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-black transition-all resize-none min-h-[120px]" placeholder="Tell us about the quality and fit..." required />
                </div>
                <button type="submit" disabled={submittingReview} className="w-full py-5 bg-black text-white rounded-[35px] text-[11px] font-black uppercase tracking-[3px] hover:bg-slate-800 transition-all disabled:opacity-50">
                  {submittingReview ? 'Processing...' : 'Execute Submission'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;
