import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MessageCircle, X, ChevronDown, 
  Tag, Shield, ArrowRight, Zap, HelpCircle,
  Plus, Minus, CheckCircle2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import './Cart.css';

const Cart = () => {
  const {
    cart, removeFromCart, updateQuantity,
    cartTotal, tax, discount, finalTotal,
    getItemPrice, applyCoupon, removeCoupon
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');

  const availableCoupons = [
    { code: 'CHASH25', desc: 'Flat 25% OFF on all orders', discount: 0.25 },
    { code: 'BOGO50', desc: 'Buy 1 Get 1 at 50% OFF', discount: 0.5 },
    { code: 'FIRST500', desc: 'Flat ₹500 OFF on first order', discount: 500 }
  ];

  const handleApplyCoupon = async (code) => {
    const result = await applyCoupon(code);
    if (result.success) {
      toast.success(result.message);
      setIsCouponModalOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  // Resolve the best image from a cart item regardless of source
  const getItemImage = (item) =>
    item?.products?.frame_image ||
    item?.frame_image ||
    item?.frameImage ||
    item?.gallery?.[0] ||
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9Ijc1IiB2aWV3Qm94PSIwIDAgMTAwIDc1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNzUiIGZpbGw9IiNGMUY1RjkiLz48cGF0aCBkPSJNMzUgMzBIMjVhNSA1IDAgMCAwLTUgNXYxMGE1IDUgMCAwIDAgNSA1aDEwYTUgNSAoIDAgMCA1LTV2LTEwYTUgNSAwIDAgMC01LTV6TTY1IDMwSDU1YTUgNSAwIDAgMC01IDV2MTBhNSA1IDAgMCAwIDUgNWgxMGE1IDUgMCAwIDAgNS01di0xMGE1IDUgMCAwIDAtNS01ek00NSAzN2gxMCIgc3Ryb2tlPSIjOTRBM0I4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==';

  const getItemName = (item) => item?.products?.name || item?.name || 'Premium Eyewear';
  const getItemId = (item) => item?.cartId || item?.product_id || item?.id;

  if (cart.length === 0) {
    return (
      <div className="cart-page empty-cart">
        <header className="cart-header-mobile">
          <Link to="/"><ArrowLeft size={20} /></Link>
          <h2>Cart (0 Items)</h2>
          <a href="#" className="help-link"><MessageCircle size={20} fill="currentColor" /> Help</a>
        </header>
        <div className="container" style={{paddingTop: '100px'}}>
          <HelpCircle size={80} strokeWidth={1} color="#eee" />
          <h2>Your cart is empty</h2>
          <p>Explore our latest collection and find your perfect pair.</p>
          <Link to="/" className="proceed-btn" style={{textDecoration: 'none', display: 'inline-block'}}>Shop Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Mobile Header */}
      <header className="cart-header-mobile">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="bg-transparent border-none p-0 cursor-pointer"><ArrowLeft size={20} /></button>
           <h2>Cart ({cart.length} Item{cart.length !== 1 ? 's' : ''})</h2>
        </div>
        <a href="https://wa.me/91XXXXXXXXXX" className="help-link">
          <MessageCircle size={20} fill="currentColor" />
          Help
        </a>
      </header>

      <div className="cart-container">
        {/* Left Column */}
        <div className="cart-main-content">
          
          {/* Cart Items */}
          <div className="cart-items-list">
            {cart.map((item) => {
              const itemId = getItemId(item);
              const basePrice = getItemPrice(item);
              const lensPrice = (item.lensSelection?.visionType?.price || 0) + (item.lensSelection?.lensPackage?.price || 0);
              const currentPrice = (basePrice + lensPrice) * (item.quantity || 1);
              const originalPrice = Math.round(currentPrice * 1.4);

              return (
                <div key={itemId} className="cart-item-card">
                  <button className="btn-remove-top" onClick={() => removeFromCart(itemId)}>
                    <X size={14} />
                  </button>
                  
                  <div className="item-layout">
                    <div className="item-img-box">
                      <img src={getItemImage(item)} alt={getItemName(item)} />
                      <div className="bestseller-badge">BestSeller <Zap size={10} fill="currentColor" /></div>
                      
                      {/* Quantity Controls */}
                      <div className="qty-picker-small">
                        <button onClick={() => updateQuantity(itemId, (item.quantity || 1) - 1)}><Minus size={12} /></button>
                        <span>{item.quantity || 1}</span>
                        <button onClick={() => updateQuantity(itemId, (item.quantity || 1) + 1)}><Plus size={12} /></button>
                      </div>
                    </div>

                    <div className="item-info">
                      <h3>{getItemName(item)}</h3>
                      <p className="item-variant">{item.products?.frame_shape || 'Medium'}</p>

                      <div className="selection-row" onClick={() => toast.success('You have selected premium lenses!')}>
                        <span>{item.lensSelection?.lensPackage?.name || 'Standard Lenses'}</span>
                        <ChevronDown size={16} />
                      </div>
                      
                      <div className="selection-row power" onClick={() => toast('Final power will be confirmed via WhatsApp/Email')}>
                        <span>Eye power for {user?.displayName || 'you'}</span>
                        <ChevronDown size={16} />
                      </div>

                      <div className="price-row">
                        <span className="price-label">Frame + Lens {item.quantity > 1 && `(x${item.quantity})`}</span>
                        <div className="price-values">
                          <span className="old-price">₹{originalPrice.toLocaleString()}</span>
                          <span className="new-price">₹{currentPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Offers Section */}
          <h2 className="section-title">Offers</h2>
          {discount.code ? (
            <div className="offer-card active">
              <div className="offer-info">
                <CheckCircle2 size={20} className="text-green-600" />
                <div>
                  <p className="font-bold">{discount.code} Applied</p>
                  <p className="text-[10px] text-gray-500">Savings added to total</p>
                </div>
              </div>
              <button onClick={removeCoupon} className="text-red-500 font-bold text-xs bg-transparent border-none cursor-pointer">REMOVE</button>
            </div>
          ) : (
            <div className="offer-card">
              <div className="offer-info">
                <Tag size={20} fill="currentColor" />
                <span>No offers applied</span>
              </div>
              <span className="offer-amount">Apply coupon for discount</span>
            </div>
          )}
          
          <button className="view-coupons-btn" onClick={() => setIsCouponModalOpen(true)}>
            <span>{discount.code ? 'Change Coupon' : 'View All Coupons'}</span>
            <ArrowRight size={18} />
          </button>

          {/* Insurance Section */}
          <div className="insurance-card" onClick={() => toast.success('Insurance benefits applied to your profile!')}>
            <div className="insurance-info">
              <div className="insurance-icon">
                <Shield size={18} />
              </div>
              <div className="insurance-text">
                <h4>Apply Insurance</h4>
                <p>Tap to avail your insurance benefits</p>
              </div>
            </div>
            <ArrowRight size={18} />
          </div>

          {/* Bill Details */}
          <h2 className="section-title">Bill Details</h2>
          <div className="bill-card-new">
             <div className="bill-item">
                <span>Total item price</span>
                <span className="value">₹{cartTotal.toLocaleString()}</span>
             </div>
             {discount.amount > 0 && (
               <div className="bill-item discount">
                  <span>Coupon Discount ({discount.code})</span>
                  <span className="value">-₹{Math.round(discount.amount).toLocaleString()}</span>
               </div>
             )}
             <div className="bill-item">
                <span>Estimated GST (18%)</span>
                <span className="value">₹{Math.round(tax).toLocaleString()}</span>
             </div>
             <div className="bill-item">
                <span>Fitting Fee</span>
                <span className="value"><span className="old-price" style={{marginRight: '8px'}}>₹199</span> <span className="free-text">FREE</span></span>
             </div>
             <div className="bill-item total">
                <span>Total Payable</span>
                <span className="value">₹{Math.round(finalTotal).toLocaleString()}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Footer */}
      <footer className="cart-footer-sticky">
        <div className="footer-bill-info">
           <h3>₹{Math.round(finalTotal).toLocaleString()}</h3>
           <p>Total bill</p>
        </div>
        <button className="proceed-btn" onClick={() => {
          if (!user) {
            toast.error('Please sign in to proceed');
            navigate('/auth', { state: { from: '/checkout' } });
          } else {
            navigate('/checkout');
          }
        }}>
          {user ? 'Proceed to Checkout' : 'Login to proceed'}
        </button>
      </footer>

      {/* Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <div className="coupon-modal-overlay">
             <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               className="coupon-modal-content"
             >
                <div className="modal-handle" onClick={() => setIsCouponModalOpen(false)} />
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold">Apply Coupon</h3>
                   <button onClick={() => setIsCouponModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
                </div>

                <div className="coupon-manual-input">
                   <input 
                    type="text" 
                    placeholder="Enter coupon code" 
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                   />
                   <button onClick={() => handleApplyCoupon(couponInput)}>APPLY</button>
                </div>

                <div className="coupons-list">
                   {availableCoupons.map(coupon => (
                     <div key={coupon.code} className="coupon-item" onClick={() => handleApplyCoupon(coupon.code)}>
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="code">{coupon.code}</p>
                              <p className="desc">{coupon.desc}</p>
                           </div>
                           <button className="apply-btn">APPLY</button>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
