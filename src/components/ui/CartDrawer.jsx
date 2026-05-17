import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, ChevronDown, Tag, Shield, ArrowRight, Zap, 
  Plus, Minus, CheckCircle2, ShoppingBag, UploadCloud, Eye
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../../lib/cloudinary';
import { subscribeCoupons } from '../../lib/firebase';
import toast from 'react-hot-toast';
import './CartDrawer.css';

const CartDrawer = () => {
  const {
    cart, removeFromCart, updateQuantity,
    cartTotal, tax, discount, finalTotal,
    getItemPrice, applyCoupon, removeCoupon,
    isCartOpen, closeCart, addToCart, updateLensSelection
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Fetch real coupons from backend
  useEffect(() => {
    if (isCartOpen) {
      const unsubscribe = subscribeCoupons((coupons) => {
        // Only show active coupons and hide demo ones (e.g., ones with 'demo' in description or specific IDs)
        const activeCoupons = coupons.filter(c => 
          c.is_active !== false && 
          !c.description?.toLowerCase().includes('demo') &&
          !c.code?.toLowerCase().includes('demo')
        );
        setAvailableCoupons(activeCoupons);
      });
      return unsubscribe;
    }
  }, [isCartOpen]);

  const handleApplyCoupon = async (code) => {
    const result = await applyCoupon(code);
    if (result.success) {
      toast.success(result.message);
      setIsCouponModalOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleFileUpload = async (itemId, file) => {
    if (!file) return;
    setUploadingId(itemId);
    const toastId = toast.loading("Uploading prescription...");
    
    try {
      const res = await uploadImage(file, 'prescriptions');
      if (res.error) throw new Error(res.error);
      
      // Update item in cart with the new prescription URL
      await updateLensSelection(itemId, {
        prescriptionUrl: res.url,
        powerOption: 'upload'
      });
      toast.success("Prescription updated!", { id: toastId });
    } catch (err) {
      toast.error("Upload failed: " + err.message, { id: toastId });
    } finally {
      setUploadingId(null);
    }
  };

  const getItemImage = (item) =>
    item?.products?.frame_image ||
    item?.frame_image ||
    item?.frameImage ||
    item?.gallery?.[0] ||
    'https://via.placeholder.com/150';

  const getItemName = (item) => item?.products?.name || item?.name || 'Premium Eyewear';
  const getItemId = (item) => item?.cartId || item?.firebaseId || item?.cartVariantKey || item?.product_id || item?.id;
  const getSelectedColorName = (item) => {
    const selectedColor = item?.lensSelection?.selectedColor;
    if (!selectedColor) return null;
    return typeof selectedColor === 'string' ? selectedColor : selectedColor.name;
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="cart-drawer-backdrop"
          />

          {/* Drawer Container */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="cart-drawer-container"
          >
            <div className="cart-drawer-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Your Cart</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.length} {cart.length === 1 ? 'Item' : 'Items'} Selected</p>
                </div>
              </div>
              <button onClick={closeCart} className="close-drawer-btn">
                <X size={20} />
              </button>
            </div>

            <div className="cart-drawer-content" data-lenis-prevent>
              {cart.length === 0 ? (
                <div className="empty-drawer">
                  <div className="empty-icon-wrapper">
                    <ShoppingBag size={48} strokeWidth={1} />
                  </div>
                  <h3>Your cart is empty</h3>
                  <p>Your curated selection will appear here.</p>
                  <button onClick={closeCart} className="shop-now-btn">Start Exploring</button>
                </div>
              ) : (
                <div className="cart-items-stack">
                  {cart.map((item) => {
                    const itemId = getItemId(item);
                    const basePrice = getItemPrice(item);
                    const lensPrice = (item.lensSelection?.visionType?.price || 0) + (item.lensSelection?.lensPackage?.price || 0);
                    const currentPrice = (basePrice + lensPrice) * (item.quantity || 1);

                    return (
                      <div key={itemId} className="drawer-item-card">
                        <div className="item-main">
                          <div className="item-img-wrapper">
                            <img src={getItemImage(item)} alt={getItemName(item)} />
                          </div>
                          <div className="item-details">
                            <div className="flex justify-between items-start">
                              <h3 className="item-name">{getItemName(item)}</h3>
                              <button onClick={() => removeFromCart(itemId)} className="remove-item-btn"><X size={14} /></button>
                            </div>
                            <p className="item-meta">
                              {item.products?.brand || item.brand || 'Premium Edition'} • {getSelectedColorName(item) ? `Color: ${getSelectedColorName(item)}` : (item.products?.frame_shape || item.frame_shape || 'Medium')}{item.lensSelection?.selectedSize ? ` / Size: ${item.lensSelection.selectedSize}` : ''}
                              {item.lensSelection?.lensPackage && (
                                <span className="block mt-1 text-indigo-600 font-bold">
                                  Lens: {item.lensSelection.lensPackage.name}
                                </span>
                              )}
                            </p>
                            
                            <div className="item-price-qty">
                              <span className="item-price">₹{currentPrice.toLocaleString()}</span>
                              <div className="qty-control">
                                <button onClick={() => updateQuantity(itemId, (item.quantity || 1) - 1)} disabled={(item.quantity || 1) <= 1}><Minus size={12} /></button>
                                <span>{item.quantity || 1}</span>
                                <button onClick={() => updateQuantity(itemId, (item.quantity || 1) + 1)}><Plus size={12} /></button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Prescription Management Section */}
                        {item.lensSelection && item.lensSelection.visionType?.id !== 'frame' && (
                          <div className="prescription-management">
                            <div className="rx-header">
                              <Eye size={12} className="text-slate-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Vision Protocol</span>
                            </div>

                            {/* Manual Power Summary if exists */}
                            {item.lensSelection.manualDetails && (
                               <div className="manual-rx-preview mb-3 p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                                  <div className="grid grid-cols-5 gap-1 text-[8px] font-black text-slate-400 uppercase mb-1 px-1">
                                     <span className="col-span-1">Eye</span>
                                     <span>SPH</span>
                                     <span>CYL</span>
                                     <span>Axis</span>
                                     <span>Addl.</span>
                                  </div>
                                  <div className="grid grid-cols-5 gap-1 text-[9px] text-slate-700 py-1 border-b border-slate-100/50">
                                     <span className="font-black text-indigo-600">R</span>
                                     <span>{item.lensSelection.manualDetails.rightSph || '-'}</span>
                                     <span>{item.lensSelection.manualDetails.rightCyl || '-'}</span>
                                     <span>{item.lensSelection.manualDetails.rightAxis || '-'}</span>
                                     <span>{item.lensSelection.manualDetails.rightAddlPower || '-'}</span>
                                  </div>
                                  <div className="grid grid-cols-5 gap-1 text-[9px] text-slate-700 py-1">
                                     <span className="font-black text-indigo-600">L</span>
                                     <span>{item.lensSelection.manualDetails.leftSph || '-'}</span>
                                     <span>{item.lensSelection.manualDetails.leftCyl || '-'}</span>
                                     <span>{item.lensSelection.manualDetails.leftAxis || '-'}</span>
                                     <span>{item.lensSelection.manualDetails.leftAddlPower || '-'}</span>
                                  </div>
                               </div>
                            )}

                            <div className="rx-status-box">
                              {item.lensSelection.prescriptionUrl ? (
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden bg-slate-50">
                                      <img src={item.lensSelection.prescriptionUrl} alt="Rx" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase">Prescription Verified</span>
                                  </div>
                                  <label className="change-rx-btn">
                                    Change
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(itemId, e.target.files[0])} />
                                  </label>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">
                                    {item.lensSelection.powerOption === 'later' ? 'Submission Pending' : item.lensSelection.manualDetails ? 'Manual Power Selected' : 'Missing Prescription'}
                                  </span>
                                  <label className="upload-rx-btn">
                                    {uploadingId === itemId ? '...' : <><UploadCloud size={12} /> Upload Now</>}
                                    <input type="file" className="hidden" accept="image/*" disabled={uploadingId === itemId} onChange={(e) => handleFileUpload(itemId, e.target.files[0])} />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {cart.length > 0 && (
                <div className="cart-summary-section">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  {discount.amount > 0 && (
                    <div className="summary-row discount">
                      <span>Discount ({discount.code})</span>
                      <span>-₹{Math.round(discount.amount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>GST (18%)</span>
                    <span>₹{Math.round(tax).toLocaleString()}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Final Amount</span>
                    <span>₹{Math.round(finalTotal).toLocaleString()}</span>
                  </div>

                  {/* Coupon Toggle */}
                  <button className="coupon-toggle-btn" onClick={() => setIsCouponModalOpen(true)}>
                    <Tag size={16} />
                    <span>{discount.code ? `Applied: ${discount.code}` : 'Apply Coupon Code'}</span>
                    <ArrowRight size={14} className="ml-auto" />
                  </button>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="footer-info">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grand Total</span>
                  <p className="text-xl font-black text-slate-900">₹{Math.round(finalTotal).toLocaleString()}</p>
                </div>
                <button 
                  className="checkout-proceed-btn" 
                  onClick={() => {
                    closeCart();
                    if (!user) {
                      toast.error('Please sign in to proceed');
                      navigate('/auth', { state: { from: '/checkout' } });
                    } else {
                      navigate('/checkout');
                    }
                  }}
                >
                  Checkout <ArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>

          {/* Coupon Mini-Modal */}
          <AnimatePresence>
            {isCouponModalOpen && (
              <div className="mini-coupon-overlay" onClick={() => setIsCouponModalOpen(false)}>
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="mini-coupon-content"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest">Apply Rewards</h3>
                    <button onClick={() => setIsCouponModalOpen(false)}><X size={16} /></button>
                  </div>
                  <div className="mini-coupon-input">
                    <input 
                      type="text" 
                      placeholder="ENTER CODE" 
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    />
                    <button onClick={() => handleApplyCoupon(couponInput)}>APPLY</button>
                  </div>
                  <div className="mini-coupons-list">
                    {availableCoupons.map(c => (
                      <div key={c.id || c.code} className="mini-coupon-item" onClick={() => handleApplyCoupon(c.code)}>
                        <span className="code">{c.code}</span>
                        <span className="desc">{c.description || `${c.discount_value}${c.discount_type === 'percentage' ? '%' : ' INR'} OFF`}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
