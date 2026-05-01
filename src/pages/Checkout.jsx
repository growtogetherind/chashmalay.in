import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, CreditCard, ShoppingBag, Shield, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/firebase';
import toast from 'react-hot-toast';
import { FadeIn } from '../components/ui/Motion';

const STEPS = ['Shipping', 'Review', 'Secure Payment'];

const Checkout = () => {
  const { cart, cartTotal, tax, finalTotal, discount, emptyCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);

  const [address, setAddress] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    line1: profile?.address?.line1 || '',
    line2: profile?.address?.line2 || '',
    city: profile?.address?.city || '',
    state: profile?.address?.state || '',
    pincode: profile?.address?.pincode || ''
  });

  const handleAddressChange = (e) => setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    if (user) {
      const { updateProfile } = await import('../lib/firebase');
      updateProfile(user.uid, { 
        full_name: address.name,
        phone: address.phone,
        address: {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode
        }
      });
    }

    setStep(1);
    window.scrollTo(0, 0);
  };

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePayment = async () => {
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY;
    if (!razorpayKey) {
      toast.error('Payment gateway is not configured.');
      return;
    }

    if (!finalTotal || finalTotal < 1) {
      toast.error('Invalid order amount.');
      return;
    }

    setProcessing(true);
    const loaded = await loadRazorpay();
    if (!loaded) { toast.error('Payment service unavailable. Try again.'); setProcessing(false); return; }

    const amountInPaise = Math.round(finalTotal * 100);

    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: 'INR',
      name: 'Chashmaly.in',
      description: `Order for ${cart.length} item(s)`,
      image: '/logo.png', // Ideally your logo
      handler: async function (response) {
        setProcessing(true);
        try {
          const order = await createOrder({
            userId: user.uid,
            items: cart,
            total: finalTotal,
            address,
            paymentId: response.razorpay_payment_id
          });
          await emptyCart();
          navigate(`/order-success/${order?.id}`);
        } catch (err) {
          console.error(err);
          setProcessing(false);
          toast.error('Order creation failed. Contact support with ID: ' + response.razorpay_payment_id);
        }
      },
      prefill: {
        name: address.name,
        email: user?.email || '',
        contact: address.phone
      },
      theme: { color: '#1A1A1A' },
      modal: { ondismiss: () => setProcessing(false) }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => {
      toast.error(`Payment failed: ${resp.error.description}`);
      setProcessing(false);
    });
    rzp.open();
    setProcessing(false);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 pt-20">
        <div className="w-24 h-24 rounded-full bg-surface-flat flex items-center justify-center border border-divider">
           <ShoppingBag size={32} className="text-secondary" strokeWidth={1} />
        </div>
        <h2 className="text-3xl font-sans font-black text-primary tracking-tighter">Your bag is empty</h2>
        <Link to="/" className="btn-secondary mt-4">Return to Archive</Link>
      </div>
    );
  }

  const InputField = ({ label, ...props }) => (
    <div className="flex flex-col gap-2">
       <input 
         {...props} 
         className="w-full bg-transparent border-b border-divider py-3 outline-none focus:border-[#2FA4B7] transition-colors text-heading font-sans placeholder-body/50"
       />
    </div>
  );

  return (
    <div className="bg-background min-h-screen pt-32 pb-24 text-primary selection:bg-accent/20">
      <div className="container max-w-6xl mx-auto">
        
        {/* Progress header */}
        <div className="flex items-center justify-center gap-4 md:gap-12 mb-16 border-b border-divider pb-8">
           {STEPS.map((s, i) => (
             <div key={s} className="flex items-center gap-2 md:gap-4">
                <span className={`text-xs font-sans uppercase tracking-[0.2em] font-semibold transition-colors duration-500 ${i <= step ? 'text-primary' : 'text-body opacity-50'}`}>
                   {i < step ? <CheckCircle size={14} className="inline mr-2 -mt-0.5" /> : null}
                   {s}
                </span>
                {i < STEPS.length -1 && <ChevronRight size={14} className="text-divider" />}
             </div>
           ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Checkout Area */}
          <div className="w-full lg:w-3/5">
            {step === 0 && (
              <FadeIn>
                 <h2 className="text-3xl font-sans font-black mb-10 flex items-center justify-between tracking-tighter">
                    Shipping Details
                 </h2>
                 <form onSubmit={handleAddressSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <InputField label="Full Name" name="name" value={address.name} onChange={handleAddressChange} placeholder="First & Last Name" required />
                       <InputField label="Contact Number" name="phone" value={address.phone} onChange={handleAddressChange} placeholder="Mobile Number" required />
                    </div>
                    <InputField label="Address Line 1" name="line1" value={address.line1} onChange={handleAddressChange} placeholder="House / Flat No., Street Name" required />
                    <InputField label="Address Line 2" name="line2" value={address.line2} onChange={handleAddressChange} placeholder="Landmark, Area (Optional)" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <InputField label="City" name="city" value={address.city} onChange={handleAddressChange} placeholder="City City" required />
                       <InputField label="State" name="state" value={address.state} onChange={handleAddressChange} placeholder="State" required />
                       <InputField label="Postal Code" name="pincode" value={address.pincode} onChange={handleAddressChange} placeholder="Postal Code" maxLength={6} required />
                    </div>
                    <div className="pt-8 text-right">
                       <button type="submit" className="btn-primary w-full md:w-auto">Continue to Review</button>
                    </div>
                 </form>
              </FadeIn>
            )}

            {step === 1 && (
              <FadeIn>
                 <div className="flex justify-between items-end mb-8 border-b border-divider pb-4">
                   <h2 className="text-3xl font-sans font-black tracking-tighter">Review Order</h2>
                   <button onClick={() => setStep(0)} className="text-xs uppercase tracking-widest text-secondary hover:text-primary transition-colors border-b border-current pb-1">Edit</button>
                </div>
                                <div className="bg-surface-flat p-8 rounded-2xl mb-12">
                   <p className="font-sans font-bold text-xl mb-4 tracking-tight">{address.name}</p>
                   <p className="text-secondary font-sans leading-loose">
                      {address.line1}, {address.line2 && `${address.line2},`} <br/>
                      {address.city}, {address.state} — {address.pincode} <br/>
                      {address.phone}
                   </p>
                </div>

                <div className="space-y-8 mb-12">
                   {cart.map((item) => {
                     const basePrice = parseInt((item.consumersPrice || item.price || "0").toString().replace(/,/g, ''));
                     let lensTotal = item.lensSelection?.visionType?.price || 0;
                     lensTotal += item.lensSelection?.lensPackage?.price || 0;

                     return (
                       <div key={item.cartId} className="flex gap-6 items-center">
                          <div className="w-24 h-24 bg-surface-flat rounded-xl p-2 border border-divider flex-shrink-0">
                             <img src={item.frameImage || item.gallery?.[0]} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="flex-1">
                             <h4 className="text-lg font-sans font-bold tracking-tight">{item.name}</h4>
                             <p className="text-sm font-sans text-secondary mb-1">Qty: {item.quantity}</p>
                             {(item.lensSelection?.visionType || item.lensSelection?.lensPackage) && (
                               <p className="text-xs font-sans text-accent">Includes Lens Package</p>
                             )}
                          </div>
                           <div className="text-lg font-sans font-black">
                             ₹{((basePrice + lensTotal) * item.quantity).toFixed(0)}
                          </div>
                       </div>
                     );
                   })}
                </div>

                <div className="text-right">
                   <button onClick={() => setStep(2)} className="btn-primary w-full md:w-auto">Proceed to Payment</button>
                </div>
              </FadeIn>
            )}

            {step === 2 && (
              <FadeIn>
                 <h2 className="text-3xl font-sans font-black mb-8 border-b border-divider pb-4 flex justify-between tracking-tighter">
                   Secure Payment
                   <button onClick={() => setStep(1)} className="text-xs font-sans uppercase tracking-widest text-secondary hover:text-primary transition-colors border-b border-current pb-1 hidden md:block">Back</button>
                </h2>
                
                <div className="bg-surface border border-accent rounded-2xl p-6 md:p-8 relative overflow-hidden mb-8 shadow-luxury">
                   <div className="flex gap-4 items-center mb-6">
                      <div className="w-6 h-6 rounded-full border-4 border-accent flex items-center justify-center">
                         <div className="w-2 h-2 rounded-full bg-accent" />
                      </div>
                       <span className="text-lg font-sans font-bold tracking-tight">Razorpay Secure Checkout</span>
                   </div>
                   <p className="text-body tracking-wide text-sm pl-10">Pay via Credit Card, Debit Card, Net Banking, or UPI.</p>
                </div>

                <div className="flex items-start gap-4 p-6 bg-surface-flat rounded-xl mb-12">
                   <Shield className="text-accent mt-0.5 flex-shrink-0" size={20} />
                   <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest mb-2 text-primary">Absolute Security</h4>
                      <p className="text-sm text-secondary leading-relaxed">Your payment information is thoroughly encrypted and securely processed. We do not store your credit card information.</p>
                   </div>
                </div>

                <button onClick={handlePayment} disabled={processing} className="w-full btn-primary py-5 text-sm">
                  {processing ? 'Connecting to gateway...' : `Authorize Payment — ₹${finalTotal.toFixed(0)}`}
                </button>
              </FadeIn>
            )}
          </div>

          {/* Sticky Summary Panel */}
          <div className="w-full lg:w-2/5">
             <div className="bg-surface glass-panel rounded-3xl p-8 sticky top-32 mt-0">
                <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] mb-8 pb-4 border-b border-divider">Order Summary</h3>
                
                <div className="space-y-4 font-sans text-sm tracking-wide mb-8">
                   <div className="flex justify-between">
                      <span className="text-secondary">Subtotal ({cart.length} items)</span>
                      <span>₹{cartTotal.toFixed(0)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-secondary">GST (18%)</span>
                      <span>₹{tax.toFixed(0)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-secondary">Shipping</span>
                      <span className="text-accent uppercase text-xs font-black tracking-widest">Complimentary</span>
                   </div>
                   {discount?.code && (
                      <div className="flex justify-between text-accent">
                         <span>Discount ({discount.code})</span>
                         <span>-₹{discount.amount.toFixed(0)}</span>
                      </div>
                   )}
                </div>

                 <div className="flex justify-between items-end border-t border-divider pt-6 mb-4">
                   <span className="font-sans font-bold text-lg tracking-tight">Total</span>
                   <span className="font-sans font-black text-3xl text-primary tracking-tighter">₹{finalTotal.toFixed(0)}</span>
                </div>
                <p className="text-[10px] text-secondary text-right">Inclusive of all duties and taxes</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
