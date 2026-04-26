import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, HelpCircle, Shield, Trash2, Tag, ArrowRight, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Cart.css';

const Cart = () => {
  const {
    cart, removeFromCart, updateQuantity,
    cartTotal, tax, discount, finalTotal,
    applyCoupon, removeCoupon, getItemPrice
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState({ text: '', success: false });

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode);
    setCouponMsg({ text: result.message, success: result.success });
    if (result.success) setCouponCode('');
  };

  // Resolve the best image from a cart item regardless of source
  const getItemImage = (item) =>
    item?.products?.frame_image ||
    item?.frame_image ||
    item?.frameImage ||
    item?.gallery?.[0] ||
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9Ijc1IiB2aWV3Qm94PSIwIDAgMTAwIDc1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNzUiIGZpbGw9IiNGMUY1RjkiLz48cGF0aCBkPSJNMzUgMzBIMjVhNSA1IDAgMCAwLTUgNXYxMGE1IDUgMCAwIDAgNSA1aDEwYTUgNSAwIDAgMCA1LTV2LTEwYTUgNSAwIDAgMC01LTV6TTY1IDMwSDU1YTUgNSAwIDAgMC01IDV2MTBhNSA1IDAgMCAwIDUgNWgxMGE1IDUgMCAwIDAgNS01di0xMGE1IDUgMCAwIDAtNS01ek00NSAzN2gxMCIgc3Ryb2tlPSIjOTRBM0I4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==';

  // Resolve the best display name
  const getItemName = (item) => item?.products?.name || item?.name || 'Premium Eyewear';

  // Get the unique cart identifier for operations
  const getItemId = (item) => item?.cartId || item?.product_id || item?.id;

  if (cart.length === 0) {
    return (
      <div className="cart-page animate-fade-in empty-state">
        <ShoppingBag size={80} strokeWidth={1} color="var(--border-color)" />
        <h2>Your shopping cart is empty!</h2>
        <p>Explore our wide range of premium eyewear.</p>
        <Link to="/" className="btn-buy" style={{ display: 'inline-block', marginTop: '1.5rem', width: 'auto', padding: '1rem 2rem' }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page animate-fade-in">
      <div className="cart-container">

        {/* Left Column: Items */}
        <div className="cart-items-column">
          <div className="cart-header">
            <h2>Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})</h2>
          </div>

          <div className="cart-items-list">
            {cart.map((item) => {
              const basePrice = getItemPrice(item);
              const lensVisionPrice = item.lensSelection?.visionType?.price || 0;
              const lensPackagePrice = item.lensSelection?.lensPackage?.price || 0;
              const unitPrice = basePrice + lensVisionPrice + lensPackagePrice;
              const totalPrice = unitPrice * (item.quantity || 1);
              const itemId = getItemId(item);

              return (
                <div key={itemId} className="cart-item-card">
                  <div className="item-main">
                    <div className="item-image-col">
                      <img src={getItemImage(item)} alt={getItemName(item)} />
                    </div>
                    <div className="item-details-col">
                      <div className="item-title-row">
                        <h3>{getItemName(item)}</h3>
                        <span className="item-total-price">₹{totalPrice.toLocaleString()}</span>
                      </div>
                      <p className="item-color">Color: {item.colorName || item.products?.color || 'Standard'}</p>

                      {item.lensSelection && (
                        <div className="lens-breakdown">
                          <div className="lens-bd-row">
                            <span>Frame</span>
                            <span>₹{basePrice.toLocaleString()}</span>
                          </div>
                          {item.lensSelection.visionType && (
                            <div className="lens-bd-row">
                              <span>Lens: {item.lensSelection.visionType.title}</span>
                              <span>₹{lensVisionPrice.toLocaleString()}</span>
                            </div>
                          )}
                          {item.lensSelection.lensPackage && (
                            <div className="lens-bd-row">
                              <span>Package: {item.lensSelection.lensPackage.name}</span>
                              <span>₹{lensPackagePrice.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="item-actions">
                        <button className="btn-remove" onClick={() => removeFromCart(itemId)}>
                          <Trash2 size={16} /> Remove
                        </button>
                        {/* Quantity Control */}
                        <div className="qty-control">
                          <button onClick={() => updateQuantity(itemId, (item.quantity || 1) - 1)}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity || 1}</span>
                          <button onClick={() => updateQuantity(itemId, (item.quantity || 1) + 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="repeat-warning">
                        <HelpCircle size={14} />
                        <span>Final prescription will be requested after checkout.</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Billing */}
        <div className="cart-bill-column">
          <div className="bill-card">
            <h3>Bill Details</h3>

            <div className="bill-row">
              <span>Item Total</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>

            {discount.code && (
              <div className="bill-row discount-row">
                <span>Discount ({discount.code})</span>
                <span>- ₹{Math.round(discount.amount).toLocaleString()}</span>
              </div>
            )}

            <div className="bill-row">
              <span>Estimated GST (18%)</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>

            <div className="bill-row delivery-row">
              <span>Delivery</span>
              <span className="free-badge">FREE</span>
            </div>

            <div className="bill-row total-row">
              <span>Total Amount</span>
              <span>₹{Math.round(finalTotal).toLocaleString()}</span>
            </div>

            {/* Coupon Section */}
            <div className="coupon-section">
              <h4><Tag size={14} /> Apply Coupon</h4>
              {!discount.code ? (
                <div className="coupon-input-group">
                  <div className="input-with-icon">
                    <Tag size={18} />
                    <input
                      type="text"
                      placeholder="Try BOGO50 or CHASH25"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponMsg({ text: '', success: false }); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                  </div>
                  <button onClick={handleApplyCoupon}>Apply</button>
                </div>
              ) : (
                <div className="applied-coupon">
                  <div className="coupon-success">
                    <Tag size={16} />
                    <span>{discount.code}</span>
                  </div>
                  <button className="remove-coupon" onClick={() => { removeCoupon(); setCouponMsg({ text: '', success: false }); }}>Remove</button>
                </div>
              )}
              {couponMsg.text && (
                <p className={couponMsg.success ? 'savings-msg' : 'coupon-error'}>{couponMsg.text}</p>
              )}
              {discount.amount > 0 && (
                <p className="savings-msg">🎉 You're saving ₹{Math.round(discount.amount).toLocaleString()} on this order!</p>
              )}
            </div>

            <button className="btn-buy checkout-btn" onClick={() => {
              if (!user) {
                toast.error('Please sign in to proceed with your order');
                navigate('/auth', { state: { from: '/checkout' } });
              } else {
                navigate('/checkout');
              }
            }}>
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            <div className="secure-badge">
              <Shield size={16} />
              <span>100% Safe & Secure Payments</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
