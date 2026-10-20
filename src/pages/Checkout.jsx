import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Shield, CheckCircle, MapPin, Phone, Truck, Edit2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/firebase';
import { uploadImage, base64ToBlob } from '../lib/cloudinary';
import toast from 'react-hot-toast';
import { FadeIn } from '../components/ui/Motion';
import { sanitizeTextInput } from '../lib/utils';

const STEPS = ['Delivery Address', 'Review Order', 'Payment'];

const getSelectedColorName = (item) => {
  const selectedColor = item?.lensSelection?.selectedColor;
  if (!selectedColor) return null;
  return typeof selectedColor === 'string' ? selectedColor : selectedColor.name;
};

const InputField = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1">
     {label && <label className="text-[10px] font-sans font-bold uppercase tracking-widest text-secondary opacity-70">{label}</label>}
     <input 
       {...props} 
       className={`w-full bg-transparent border-b py-3 outline-none focus:border-[#2FA4B7] transition-colors text-heading font-sans placeholder-body/50 ${
         error ? 'border-rose-500' : 'border-divider'
       }`}
     />
     {error && <span className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-wider">{error}</span>}
  </div>
);

const Checkout = () => {
  const { cart, cartTotal, finalTotal, discount, coupon, emptyCart, updateLensSelection } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const [address, setAddress] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    dob: profile?.dob || '',
    line1: profile?.address?.line1 || '',
    line2: profile?.address?.line2 || '',
    city: profile?.address?.city || '',
    state: profile?.address?.state || '',
    pincode: profile?.address?.pincode || ''
  });

  const handleAddressChange = (e) => {
    const rawValue = e.target.value;
    const sanitizedValue = typeof rawValue === 'string' ? sanitizeTextInput(rawValue) : rawValue;
    setAddress(prev => ({ ...prev, [e.target.name]: sanitizedValue }));
  };

  useEffect(() => {
    loadRazorpay();
  }, []);

  useEffect(() => {
    const fetchPincodeData = async () => {
      if (address.pincode.length === 6) {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${address.pincode}`);
          const data = await res.json();
          if (data[0].Status === "Success") {
            const { District, State } = data[0].PostOffice[0];
            setAddress(prev => ({
              ...prev,
              city: District,
              state: State
            }));
            toast.success(`Auto-filled: ${District}, ${State}`);
          }
        } catch {
          // Ignore pincode lookup failures and keep checkout flow intact.
        }
      }
    };
    fetchPincodeData();
  }, [address.pincode]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!address.name?.trim()) newErrors.name = 'Full name is required';
    if (!address.phone?.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(address.phone.trim())) newErrors.phone = 'Please enter a valid 10-digit phone number';
    if (!address.line1?.trim()) newErrors.line1 = 'Address line 1 is required';
    if (!address.city?.trim()) newErrors.city = 'City is required';
    if (!address.state?.trim()) newErrors.state = 'State is required';
    if (!address.pincode?.trim()) newErrors.pincode = 'Postal code is required';
    else if (!/^\d{6}$/.test(address.pincode.trim())) newErrors.pincode = 'Please enter a valid 6-digit postal code';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please correct the validation errors on the form.');
      return;
    }
    setErrors({});
    
    setProcessing(true);

    // Process any pending base64 prescription uploads when saving the address
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      if (item.lensSelection?.prescriptionUrl && item.lensSelection.prescriptionUrl.startsWith('data:')) {
        const toastId = toast.loading(`Uploading prescription for ${item.name}...`);
        try {
          const blob = base64ToBlob(item.lensSelection.prescriptionUrl);
          const file = new File([blob], `prescription-${item.id}.webp`, { type: 'image/webp' });
          const res = await uploadImage(file, 'prescriptions');
          
          if (res.error) throw new Error(res.error);
          
          toast.success("Prescription uploaded!", { id: toastId });
          // Update the cart context so the final url is persisted
          if (updateLensSelection) {
            // Use secureUrl (raw Cloudinary URL) — not the display-transformed url — so Telegram links & admin downloads work correctly
            await updateLensSelection(item.cartVariantKey || item.firebaseId || item.id, { prescriptionUrl: res.secureUrl || res.url });
          }
        } catch (error) {
          toast.error(`Failed to upload prescription for ${item.name}`, { id: toastId });
          setProcessing(false);
          return; // Stop transition to Review if upload fails
        }
      }
    }

    if (user) {
      const { updateProfile } = await import('../lib/firebase');
      updateProfile(user.uid, { 
        full_name: address.name,
        phone: address.phone,
        dob: address.dob,
        address: {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode
        }
      });
    }

    setProcessing(false);
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
    // Key ID is a public identifier (not a secret) — safe to embed as fallback.
    // VITE_RAZORPAY_KEY_ID is preferred (set in Vercel env vars for production).
    const razorpayKey =
      import.meta.env.VITE_RAZORPAY_KEY_ID ||
      import.meta.env.VITE_RAZORPAY_KEY ||
      'rzp_test_T8Y4OVZReJCDxP';
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
    if (!loaded) {
      toast.error('Payment service unavailable. Try again.');
      setProcessing(false);
      return;
    }

    const amountInPaise = Math.round(finalTotal * 100);
    let razorpayOrderId = null;
    let razorpayOrderAmount = amountInPaise;
    let razorpayOrderCurrency = 'INR';

    // STEP 1: Fast server order initiation (strictly capped at 2s to prevent UI delays)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const token = await user?.getIdToken?.();
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        signal: controller.signal,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          items: cart,
          address,
          couponCode: discount?.code || coupon?.code || null,
          amount: amountInPaise,
        }),
      });
      clearTimeout(timeoutId);

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        if (orderData.order_id) {
          razorpayOrderId = orderData.order_id;
          razorpayOrderAmount = orderData.amount || amountInPaise;
          razorpayOrderCurrency = orderData.currency || 'INR';
        }
      } else {
        const errJson = await orderRes.json().catch(() => ({}));
        console.warn('Backend order initiation notice:', errJson.error || orderRes.statusText);
      }
    } catch (orderInitErr) {
      console.warn('Backend order API skipped/timed out, opening direct checkout immediately:', orderInitErr.message);
    }

    // STEP 2: Configure Razorpay modal (works seamlessly with or without order_id)
    const options = {
      key: razorpayKey,
      amount: razorpayOrderAmount,
      currency: razorpayOrderCurrency,
      name: 'Chashmalay.in',
      description: `Order for ${cart.length} item(s)`,
      image: '/logo.webp',
      handler: async function (response) {
        setProcessing(true);
        let finalOrderId = response.razorpay_order_id || razorpayOrderId;
        let serverVerified = false;

        // Try server-side verification if signature is present
        if (response.razorpay_signature && response.razorpay_order_id) {
          try {
            const token = await user?.getIdToken?.();
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              finalOrderId = verifyData.order_id || finalOrderId;
              serverVerified = true;
            }
          } catch (verifyErr) {
            console.warn('Server verification bypassed or delayed:', verifyErr.message);
          }
        }

        // Guarantee order persistence in Firestore (authenticated Firebase User)
        try {
          const createdOrder = await createOrder({
            userId: user.uid,
            items: cart,
            total: finalTotal,
            address,
            paymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id || razorpayOrderId || null,
            couponCode: discount?.code || coupon?.code || null,
            discountAmount: discount?.amount || 0
          });

          const confirmedId = createdOrder?.id || finalOrderId || response.razorpay_payment_id;
          await emptyCart();
          navigate(`/order-success/${confirmedId}`);
        } catch (saveErr) {
          console.error('Client order save failed:', saveErr);
          if (serverVerified) {
            console.info('Order was verified server-side despite client save issue. Proceeding to order success.');
            await emptyCart();
            navigate(`/order-success/${finalOrderId || response.razorpay_payment_id}`);
            return;
          }
          setProcessing(false);
          toast.error(saveErr.message || ('Order confirmation failed. Please contact support with Payment ID: ' + response.razorpay_payment_id));
        }
      },
      prefill: {
        name: address.name,
        email: user?.email || '',
        contact: address.phone,
      },
      theme: { color: '#1A1A1A' },
      modal: { ondismiss: () => setProcessing(false) },
    };

    if (razorpayOrderId) {
      options.order_id = razorpayOrderId;
    }

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        toast.error(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
        setProcessing(false);
      });
      rzp.open();
    } catch (rzpErr) {
      console.error('Failed to open Razorpay modal:', rzpErr);
      toast.error('Failed to open payment gateway. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 pt-20">
        <div className="w-24 h-24 rounded-full bg-surface-flat flex items-center justify-center border border-divider">
           <ShoppingBag size={32} className="text-secondary" strokeWidth={1} />
        </div>
        <h2 className="text-3xl font-sans font-black text-primary tracking-tighter">Your cart is empty</h2>
        <Link to="/" className="btn-secondary mt-4">Continue Shopping</Link>
      </div>
    );
  }

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
                 <div className="mb-10">
                   <h2 className="text-3xl font-sans font-black tracking-tighter mb-2">
                      Delivery Address
                   </h2>
                   <p className="text-sm text-secondary">Please enter the address where you want your order delivered.</p>
                 </div>
                 <form onSubmit={handleAddressSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <InputField label="Full Name" name="name" value={address.name} onChange={handleAddressChange} error={errors.name} placeholder="Your Full Name" required />
                       <InputField label="Mobile Number" name="phone" value={address.phone} onChange={handleAddressChange} error={errors.phone} placeholder="10-digit mobile number" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <InputField label="Date of Birth (Optional)" name="dob" type="date" value={address.dob} onChange={handleAddressChange} />
                       <div className="hidden md:block" /> 
                    </div>
                    <InputField label="Flat / House No. & Street" name="line1" value={address.line1} onChange={handleAddressChange} error={errors.line1} placeholder="Flat / House No., Building Name, Street" required />
                    <InputField label="Area / Landmark (Optional)" name="line2" value={address.line2} onChange={handleAddressChange} placeholder="Near landmark, colony, or sector (optional)" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <InputField label="City" name="city" value={address.city} onChange={handleAddressChange} error={errors.city} placeholder="City" required />
                       <InputField label="State" name="state" value={address.state} onChange={handleAddressChange} error={errors.state} placeholder="State" required />
                       <InputField label="Pincode" name="pincode" value={address.pincode} onChange={handleAddressChange} error={errors.pincode} placeholder="6-digit pincode" maxLength={6} required />
                    </div>
                    <div className="pt-8 text-right">
                       <button type="submit" disabled={processing} className="btn-primary w-full md:w-auto">
                         {processing ? 'Saving...' : 'Continue to Review'}
                       </button>
                    </div>
                 </form>
              </FadeIn>
            )}

            {step === 1 && (
              <FadeIn>
                 <div className="flex justify-between items-end mb-8 border-b border-divider pb-4">
                   <h2 className="text-3xl font-sans font-black tracking-tighter">Review Your Order</h2>
                   <button onClick={() => setStep(0)} className="text-xs uppercase tracking-widest text-secondary hover:text-primary transition-colors border-b border-current pb-1">Change Address</button>
                </div>

                {/* Delivery Address Card */}
                <div className="bg-surface-flat border border-divider rounded-2xl p-6 md:p-8 mb-10 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-divider">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-sm tracking-tight text-primary">Delivery Address</h3>
                        <p className="text-[11px] text-secondary">Your order will be delivered to this address</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setStep(0)} 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline uppercase tracking-wider"
                    >
                      <Edit2 size={12} /> Change
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">Name & Contact</span>
                      <p className="font-bold text-base text-primary">{address.name}</p>
                      <p className="text-secondary flex items-center gap-1.5 mt-1 text-xs">
                        <Phone size={13} className="text-accent" /> {address.phone}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">Address</span>
                      <p className="text-body leading-relaxed font-medium">
                        {address.line1}
                        {address.line2 && <span className="block text-secondary text-xs">{address.line2}</span>}
                        <span className="block font-bold text-primary mt-1">
                          {address.city}, {address.state} — {address.pincode}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6 pb-2 border-b border-divider">
                  <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-secondary">Items in Your Order ({cart.length})</h3>
                  <span className="text-xs text-accent font-semibold flex items-center gap-1"><Truck size={14} /> Free Delivery</span>
                </div>

                <div className="space-y-8 mb-12">
                   {cart.map((item) => {
                     const basePrice = parseInt((item.consumersPrice || item.price || "0").toString().replace(/,/g, ''));
                     let lensTotal = 0;
                     if (item.lensSelection?.selectedLens?.price) {
                       lensTotal += Number(item.lensSelection.selectedLens.price);
                     } else if (item.lensSelection?.lensPackage?.price) {
                       lensTotal += Number(item.lensSelection.lensPackage.price);
                     }
                     if (item.lensSelection?.addons && item.lensSelection.addons.length > 0) {
                       item.lensSelection.addons.forEach(a => {
                         lensTotal += Number(a.price || 0);
                       });
                     }
                     if (item.lensSelection?.visionType?.price) {
                       lensTotal += Number(item.lensSelection.visionType.price);
                     }

                     return (
                       <div key={item.cartId} className="flex gap-6 items-center">
                          <div className="w-24 h-24 bg-surface-flat rounded-xl p-2 border border-divider flex-shrink-0">
                             <img src={item.frameImage || item.gallery?.[0]} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="flex-1">
                             <h4 className="text-lg font-sans font-bold tracking-tight">{item.name}</h4>
                             <p className="text-sm font-sans text-secondary mb-1">Qty: {item.quantity}</p>
                             {(getSelectedColorName(item) || item.lensSelection?.selectedSize) && (
                               <p className="text-xs font-sans text-secondary mb-1">
                                 {getSelectedColorName(item) ? `Color: ${getSelectedColorName(item)}` : 'Color: Standard'}{item.lensSelection?.selectedSize ? ` / Size: ${item.lensSelection.selectedSize}` : ''}
                               </p>
                             )}
                             {(item.lensSelection?.selectedLens || item.lensSelection?.lensPackage) && (
                               <p className="text-xs font-sans text-accent">
                                 Lens: {item.lensSelection.selectedLens?.name || item.lensSelection.lensPackage.name} ({item.lensSelection.visionType?.name || 'Clear'})
                               </p>
                             )}
                             {item.lensSelection?.addons && item.lensSelection.addons.length > 0 && (
                               <p className="text-[10px] font-sans text-secondary">
                                 Add-ons: {item.lensSelection.addons.map(a => a.name).join(', ')}
                               </p>
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
                   <button onClick={() => setStep(2)} className="btn-primary w-full md:w-auto">Continue to Payment</button>
                </div>
              </FadeIn>
            )}

            {step === 2 && (
              <FadeIn>
                 <h2 className="text-3xl font-sans font-black mb-8 border-b border-divider pb-4 flex justify-between tracking-tighter">
                   Payment
                   <button onClick={() => setStep(1)} className="text-xs font-sans uppercase tracking-widest text-secondary hover:text-primary transition-colors border-b border-current pb-1 hidden md:block">Back</button>
                </h2>

                {/* Verified Delivery Address on Payment Step */}
                <div className="bg-surface-flat border border-divider rounded-2xl p-5 mb-8 flex items-start justify-between shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin size={16} />
                    </div>
                    <div className="text-xs font-sans">
                      <span className="font-bold text-sm text-primary block">Delivering to: {address.name}</span>
                      <span className="text-secondary flex items-center gap-1 mt-0.5 font-medium">
                        <Phone size={11} className="text-accent" /> {address.phone}
                      </span>
                      <span className="text-body block mt-1 leading-snug">
                        {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} — {address.pincode}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setStep(0)} 
                    className="text-xs font-bold text-accent hover:underline flex-shrink-0 ml-2 uppercase tracking-wider"
                  >
                    Change
                  </button>
                </div>
                
                <div className="bg-surface border border-accent rounded-2xl p-6 md:p-8 relative overflow-hidden mb-8 shadow-luxury">
                   <div className="flex gap-4 items-center mb-6">
                      <div className="w-6 h-6 rounded-full border-4 border-accent flex items-center justify-center">
                         <div className="w-2 h-2 rounded-full bg-accent" />
                      </div>
                       <span className="text-lg font-sans font-bold tracking-tight">Pay Online with Razorpay</span>
                   </div>
                   <p className="text-body tracking-wide text-sm pl-10">Pay easily using UPI (GPay, PhonePe, Paytm), Cards, or Net Banking.</p>
                </div>

                <div className="flex items-start gap-4 p-6 bg-surface-flat rounded-xl mb-12">
                   <Shield className="text-accent mt-0.5 flex-shrink-0" size={20} />
                   <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest mb-2 text-primary">100% Secure Payment</h4>
                      <p className="text-sm text-secondary leading-relaxed">Your payment is encrypted and completely safe. We never store your card details or banking PIN.</p>
                   </div>
                </div>

                <button onClick={handlePayment} disabled={processing} className="w-full btn-primary py-5 text-sm">
                  {processing ? 'Opening payment...' : `Pay Now — ₹${finalTotal.toFixed(0)}`}
                </button>
              </FadeIn>
            )}
          </div>

          {/* Sticky Summary Panel */}
          <div className="w-full lg:w-2/5">
             <div className="bg-surface glass-panel rounded-3xl p-6 md:p-8 sticky top-32 mt-0 shadow-sm border border-divider">
                <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] mb-6 pb-4 border-b border-divider flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-secondary font-normal font-sans text-xs">({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                </h3>

                {/* Items in Order Preview */}
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 mb-6 border-b border-divider pb-6">
                  {cart.map((item) => {
                    const basePrice = parseInt((item.consumersPrice || item.price || "0").toString().replace(/,/g, ''));
                    let lensTotal = 0;
                    if (item.lensSelection?.selectedLens?.price) {
                      lensTotal += Number(item.lensSelection.selectedLens.price);
                    } else if (item.lensSelection?.lensPackage?.price) {
                      lensTotal += Number(item.lensSelection.lensPackage.price);
                    }
                    if (item.lensSelection?.addons && item.lensSelection.addons.length > 0) {
                      item.lensSelection.addons.forEach(a => {
                        lensTotal += Number(a.price || 0);
                      });
                    }
                    if (item.lensSelection?.visionType?.price) {
                      lensTotal += Number(item.lensSelection.visionType.price);
                    }
                    const itemTotal = (basePrice + lensTotal) * (item.quantity || 1);

                    return (
                      <div key={item.cartId || item.id} className="flex gap-3 items-center text-xs">
                        <div className="w-12 h-12 bg-surface-flat rounded-lg p-1 border border-divider flex-shrink-0 flex items-center justify-center">
                          <img src={item.frameImage || item.gallery?.[0]} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-primary truncate">{item.name}</p>
                          <p className="text-secondary text-[11px]">Qty: {item.quantity || 1}{getSelectedColorName(item) ? ` • ${getSelectedColorName(item)}` : ''}</p>
                        </div>
                        <span className="font-bold text-primary flex-shrink-0">₹{itemTotal.toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Verified Delivery Destination snippet in Sidebar if entered */}
                {address.city && address.name && (
                  <div className="bg-surface-flat/80 rounded-xl p-3 mb-6 text-xs font-sans border border-divider/60 flex items-start gap-2">
                    <MapPin size={14} className="text-accent flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-bold text-primary block truncate">Delivering to: {address.name}</span>
                      <span className="text-secondary text-[11px] block truncate">{address.city}, {address.state} — {address.pincode}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 font-sans text-sm tracking-wide mb-8">
                   <div className="flex justify-between">
                      <span className="text-secondary">Subtotal ({cart.length} items)</span>
                      <span>₹{cartTotal.toFixed(0)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-secondary">Shipping</span>
                      <span className="text-accent uppercase text-xs font-black tracking-widest">Free</span>
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
                <p className="text-[10px] text-secondary text-right flex items-center justify-end gap-1">
                  <Truck size={12} className="text-accent" /> Free Delivery
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
