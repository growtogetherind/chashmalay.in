import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Star, ShieldCheck, RotateCcw, Truck, Info, Heart, Share2, MessageSquare, Send, User } from 'lucide-react';
import { getProductById, addReview, getProducts } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ui/ProductCard';
import LensSelector from '../components/ui/LensSelector';
import { FadeIn, RevealText, TRANSITIONS } from '../components/ui/Motion';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [activeSize, setActiveSize] = useState('Medium');
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const WISHLIST_KEY = 'chashmaly_wishlist';
  const getWishlist = () => {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; }
  };

  const toggleWishlist = () => {
    if (!product) return;
    const wishlist = getWishlist();
    const exists = wishlist.includes(product.id);
    const updated = exists ? wishlist.filter(id => id !== product.id) : [...wishlist, product.id];
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
    setIsWishlisted(!exists);
    toast.success(exists ? 'Removed from wishlist' : 'Added to wishlist!');
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name || 'Chashmaly Eyewear',
      text: `Discover ${product?.name} on Chashmaly.in`,
      url: window.location.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await getProductById(id);
      if (!error && data) {
        data.colors = data.colors || [];
        const colorImages = data.colors.map(c => c.image).filter(Boolean);
        data.gallery = Array.from(new Set([...(data.gallery || []), data.frame_image, data.model_image, ...colorImages])).filter(Boolean);
        data.specs = data.specs || {};
        setProduct(data);
        
        const { data: allProds } = await getProducts({ category: data.category });
        if (allProds) setRelatedProducts(allProds.filter(p => p.id !== data.id).slice(0, 4));
      }
      setLoading(false);
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (product) setIsWishlisted(getWishlist().includes(product.id));
  }, [product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to leave a review");
    if (!reviewForm.comment.trim()) return toast.error("Please enter a comment");

    setSubmittingReview(true);
    const { error } = await addReview(id, user.uid, reviewForm.rating, reviewForm.comment, {
      full_name: user.displayName || 'Customer',
      email: user.email
    });

    if (error) toast.error("Failed to submit review");
    else {
      toast.success("Review submitted! Thank you.");
      setReviewForm({ rating: 5, comment: '' });
      const { data } = await getProductById(id);
      if (data) setProduct(data);
    }
    setSubmittingReview(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center font-sans">Product Archive Not Found.</div>;

  return (
    <div className="bg-background text-primary pt-32 pb-24 min-h-screen">
      <div className="container">
        
        {/* Breadcrumb */}
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-widest text-secondary mb-12">
            <Link to="/" className="hover:text-primary transition-colors duration-300">Home</Link>
            <span>/</span>
            <Link to="/category/all" className="hover:text-primary transition-colors duration-300">Archive</Link>
            <span>/</span>
            <span className="text-primary">{product.name}</span>
          </div>
        </FadeIn>

        <div className="flex flex-col lg:flex-row gap-16 xl:gap-24">
          
          {/* Gallery (Left) */}
          <div className="w-full lg:w-3/5 flex flex-col md:flex-row gap-8">
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible no-scrollbar order-2 md:order-1">
              {product.gallery.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-surface-flat flex-shrink-0 transition-all duration-300 ${activeImage === idx ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-2 drop-shadow-md" />
                </button>
              ))}
            </div>
            
            <div className="relative flex-1 bg-surface-flat rounded-[2.5rem] p-12 lg:p-24 flex items-center justify-center order-1 md:order-2 border border-divider">
              <button
                className="absolute top-8 right-8 w-12 h-12 rounded-full border border-divider bg-surface flex items-center justify-center hover:scale-110 transition-transform duration-500 z-10"
                onClick={toggleWishlist}
              >
                <Heart size={20} fill={isWishlisted ? 'var(--oa-accent, #C5A880)' : 'none'} color={isWishlisted ? 'var(--oa-accent, #C5A880)' : '#1A1A1A'} />
              </button>
              
              <AnimatePresence mode="popLayout">
                <motion.img 
                  key={activeImage}
                  src={product.gallery[activeImage]} 
                  alt={product.name} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={TRANSITIONS.cinema}
                  className="w-full max-w-[80%] h-auto object-contain drop-shadow-2xl" 
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Details (Right) */}
          <FadeIn delay={0.2} className="w-full lg:w-2/5 flex flex-col pt-4">
            <div className="flex justify-between items-start mb-6">
               <span className="text-xs font-sans font-semibold uppercase tracking-[0.3em] text-accent block">
                  {product.brand || 'Signature Series'}
               </span>
               <div className="flex items-center gap-2 text-xs font-sans text-secondary">
                 <Star size={14} fill="currentColor" /> 
                 <span>{product.rating > 0 ? `${product.rating} | ${product.reviewCount} Reviews` : "No reviews"}</span>
               </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif text-primary tracking-tight mb-2">{product.name}</h1>
            <p className="text-secondary font-sans tracking-wide mb-8">{product.model || product.category}</p>

            <div className="flex items-end gap-6 mb-12">
               <motion.span 
                 key={product.price}
                 initial={{ y: -10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={TRANSITIONS.spring}
                 className="text-4xl font-serif text-primary"
               >
                  ₹{product.consumersPrice || product.price}
               </motion.span>
               {product.originalPrice && (
                  <span className="text-xl font-sans text-secondary line-through pb-1">₹{product.originalPrice}</span>
               )}
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8 border-t border-divider pt-8">
                 <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-sans font-semibold uppercase tracking-widest text-primary">Color</span>
                    <span className="text-sm font-sans text-secondary">{product.colors[activeColor]?.name}</span>
                 </div>
                 <div className="flex gap-4">
                    {product.colors.map((color, idx) => (
                      <button 
                         key={idx}
                         onClick={() => {
                            setActiveColor(idx);
                            const galleryIdx = product.gallery.indexOf(color.image);
                            if (galleryIdx !== -1) setActiveImage(galleryIdx);
                         }}
                         className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${activeColor === idx ? 'border-primary' : 'border-transparent'}`}
                      >
                         <div className="w-8 h-8 rounded-full border border-divider shadow-sm" style={{ backgroundColor: color.hex }} />
                      </button>
                    ))}
                 </div>
              </div>
            )}

            {/* Check Availability */}
            <div className="mb-12 border-t border-divider pt-8 space-y-6">
               <button 
                 onClick={() => setIsLensModalOpen(true)}
                 disabled={product.stock_quantity <= 0}
                 className="w-full btn-primary disabled:bg-divider disabled:text-secondary disabled:shadow-none"
               >
                 {product.stock_quantity <= 0 ? 'Out of Stock' : 'Select Lenses & Buy'}
               </button>
               
               <button onClick={handleShare} className="w-full btn-secondary flex items-center justify-center gap-3">
                 <Share2 size={16} /> Share Design
               </button>
            </div>

            {/* Trust Markers */}
            <div className="grid grid-cols-2 gap-y-6 text-sm font-sans text-secondary">
               <div className="flex items-center gap-3"><Truck size={18} /> Tomorrow Delivery</div>
               <div className="flex items-center gap-3"><ShieldCheck size={18} /> 1 Year Warranty</div>
               <div className="flex items-center gap-3"><RotateCcw size={18} /> 14-Day Returns</div>
               <div className="flex items-center gap-3"><Info size={18} /> Genuine Parts</div>
            </div>
          </FadeIn>
        </div>

      </div>

      {/* Details accordion/section */}
      <section className="mt-32 border-t border-divider py-32 bg-surface">
         <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
               <div>
                  <RevealText text="Craftsmanship." className="text-3xl font-serif text-primary block mb-8" />
                  <p className="text-secondary font-sans leading-relaxed tracking-wide text-lg">
                    {product.description || "Elegant and sophisticated, these eyewear pieces represent a dialogue between refined geometry and premium materials. Experience uncompromising clarity and comfort."}
                  </p>
               </div>
               <div>
                  <RevealText text="Specifications." className="text-3xl font-serif text-primary block mb-8" />
                  <div className="divide-y divide-divider font-sans">
                     {Object.entries(product.specs || { Material: 'Premium Acetate', Weight: '24g' }).map(([key, val]) => (
                        <div key={key} className="py-6 flex justify-between">
                           <span className="text-secondary">{key}</span>
                           <span className="text-primary font-medium text-right">{val}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Recommendations */}
      <section className="py-32 bg-background border-t border-divider">
         <div className="container">
            <RevealText text="Recommended." className="text-4xl font-serif text-primary block mb-16" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
               {relatedProducts.length > 0 ? relatedProducts.map(p => (
                 <ProductCard key={p.id} product={p} />
               )) : (
                 <p className="text-secondary col-span-full">Archive currently updating.</p>
               )}
            </div>
         </div>
      </section>

      <LensSelector 
        isOpen={isLensModalOpen} 
        onClose={() => setIsLensModalOpen(false)}
        product={product}
      />
      
      {/* Sticky Mobile Buy */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-xl border-t border-divider p-6 lg:hidden z-50 flex items-center justify-between">
         <div>
            <p className="font-serif text-2xl text-primary mb-1">₹{product.consumersPrice || product.price}</p>
         </div>
         <button 
            onClick={() => setIsLensModalOpen(true)}
            className="btn-primary py-3 px-8 text-xs"
         >
            Select Lenses
         </button>
      </div>
    </div>
  );
};

export default ProductDetail;
