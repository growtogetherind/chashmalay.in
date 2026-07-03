import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getCartItems, upsertCartItem, removeCartItem, emptyCart as clearFirebaseCart, validateCoupon } from '../lib/firebase';
import toast from 'react-hot-toast';

const CartContext = createContext({});
export const useCart = () => useContext(CartContext);

const CART_STORAGE_KEY = 'chashmalay_guest_cart';

const normalizeSelectedColor = (selectedColor) => {
  if (!selectedColor) return null;
  if (typeof selectedColor === 'string') return { name: selectedColor };

  return {
    name: selectedColor.name || '',
    hex: selectedColor.hex || '',
    image: selectedColor.image || ''
  };
};

const getColorName = (item) => {
  const selectedColor = item?.lensSelection?.selectedColor || item?.lens_selection?.selectedColor;
  if (!selectedColor) return 'standard';
  return typeof selectedColor === 'string' ? selectedColor : selectedColor.name || 'standard';
};

const getCartLineKey = (productId, lensSelection = null, selectedSize = null) => {
  const colorName = getColorName({ lensSelection });
  const size = selectedSize || lensSelection?.selectedSize || 'standard';
  return [productId, colorName, size]
    .filter(Boolean)
    .map((part) => String(part).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    .join('_');
};

const matchesIdentifier = (item, identifier) => (
  item.cartId === identifier ||
  item.firebaseId === identifier ||
  item.cartVariantKey === identifier ||
  item.product_id === identifier ||
  item.id === identifier
);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleCart = () => setIsCartOpen(prev => !prev);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const [discount, setDiscount] = useState({ amount: 0, code: null });
  const [activeCouponData, setActiveCouponData] = useState(null);

  // ─── Unified price reader ─────────────────────────────────────────────────────
  // Handles both Firebase cart items (item.products.price) and guest items (item.price)
  const getItemPrice = (item) => {
    const priceRaw = item?.products?.price ?? item?.consumersPrice ?? item?.price ?? 0;
    const priceStr = priceRaw.toString().replace(/,/g, '');
    const parsed = parseFloat(priceStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getFullItemPrice = (item) => {
    let itemPrice = getItemPrice(item);
    if (item.lensSelection?.selectedLens?.price) {
      itemPrice += Number(item.lensSelection.selectedLens.price);
    } else if (item.lensSelection?.lensPackage?.price) {
      itemPrice += Number(item.lensSelection.lensPackage.price);
    }
    if (item.lensSelection?.addons && item.lensSelection.addons.length > 0) {
      item.lensSelection.addons.forEach(a => {
        itemPrice += Number(a.price || 0);
      });
    }
    if (item.lensSelection?.visionType?.price) {
      itemPrice += Number(item.lensSelection.visionType.price);
    }
    return itemPrice;
  };

  // ─── Load Cart ────────────────────────────────────────────────────────────────
  const loadCart = useCallback(async () => {
    if (user) {
      setLoading(true);
      // Merge guest cart into Firebase on login
      try {
        const localRaw = localStorage.getItem(CART_STORAGE_KEY);
        const localCart = localRaw ? JSON.parse(localRaw) : [];
        if (localCart.length > 0) {
          for (const item of localCart) {
            const pid = item.product_id || item.id;
            const cartVariantKey = item.cartVariantKey || getCartLineKey(pid, item.lensSelection);
            if (pid) await upsertCartItem(user.uid, pid, item.quantity || 1, item.lensSelection, cartVariantKey);
          }
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      } catch (e) {
        console.warn('Cart merge error:', e);
      }

      const { data, error } = await getCartItems(user.uid);
      if (!error && data) {
        // Normalize Firebase items to match guest structure (flattened)
        const normalized = data.map(item => ({
          ...item.products,
          product_id: item.product_id,
          quantity: item.quantity,
          lensSelection: item.lens_selection || null,
          firebaseId: item.id,
          cartId: item.id,
          cartVariantKey: item.cart_variant_key || item.id,
          id: item.product_id
        }));
        setCart(normalized);
      }
      setLoading(false);
    } else {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        setCart(stored ? JSON.parse(stored) : []);
      } catch {
        setCart([]);
      }
    }
  }, [user]);

  useEffect(() => { loadCart(); }, [loadCart]);

  // ─── Add to Cart ──────────────────────────────────────────────────────────────
  const addToCart = async (product, lensSelection = null) => {
    openCart();
    // Sanitize to avoid circular refs from React elements which break Firebase
    const sanitizedLenses = lensSelection ? {
      visionType: lensSelection.visionType
        ? { id: lensSelection.visionType.id, name: lensSelection.visionType.name || lensSelection.visionType.title, slug: lensSelection.visionType.slug || '', price: lensSelection.visionType.price }
        : null,
      selectedLens: lensSelection.selectedLens
        ? { id: lensSelection.selectedLens.id, name: lensSelection.selectedLens.name, price: lensSelection.selectedLens.price }
        : null,
      addons: Array.isArray(lensSelection.addons)
        ? lensSelection.addons.map(a => ({ id: a.id, name: a.name, price: a.price, group: a.group || '' }))
        : [],
      // Backward compatibility mapping for old code referencing lensPackage
      lensPackage: lensSelection.selectedLens
        ? { id: lensSelection.selectedLens.id, name: lensSelection.selectedLens.name, price: lensSelection.selectedLens.price }
        : (lensSelection.lensPackage ? { id: lensSelection.lensPackage.id, name: lensSelection.lensPackage.name, price: lensSelection.lensPackage.price } : null),
      powerOption: lensSelection.powerOption || null,
      selectedColor: normalizeSelectedColor(lensSelection.selectedColor),
      selectedSize: lensSelection.selectedSize || null,
      manualDetails: lensSelection.manualDetails || null,
      prescriptionUrl: lensSelection.prescriptionUrl || null,
      isContactLens: lensSelection.isContactLens || false
    } : null;

    const cartVariantKey = getCartLineKey(product.id, sanitizedLenses);
    let targetQty = 1;

    // Optimistic UI Update
    setCart(prev => {
      const existingIdx = prev.findIndex(item => (item.cartVariantKey || getCartLineKey(item.product_id || item.id, item.lensSelection)) === cartVariantKey);
      let updated;
      if (existingIdx >= 0) {
        targetQty = (prev[existingIdx].quantity || 1) + 1;
        updated = prev.map((item, i) =>
          i === existingIdx ? { ...item, quantity: targetQty } : item
        );
      } else {
        targetQty = 1;
        updated = [...prev, {
          ...product,
          product_id: product.id,
          quantity: 1,
          lensSelection: sanitizedLenses,
          cartId: cartVariantKey,
          cartVariantKey
        }];
      }
      
      if (!user) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    toast.success(`${product.name || 'Item'} added to cart!`);

    // Async Firebase Sync
    if (user) {
      upsertCartItem(user.uid, product.id, targetQty, sanitizedLenses, cartVariantKey).then(({ error }) => {
        if (error) {
          toast.error('Sync failed, refreshing cart.');
          loadCart();
        }
      });
    }
  };

  const updateLensSelection = async (identifier, lensSelection) => {
    const item = cart.find(i => matchesIdentifier(i, identifier));
    const pid = item?.product_id || identifier;

    setCart(prev => {
      const updated = prev.map(item => 
        matchesIdentifier(item, identifier)
          ? { ...item, lensSelection: { ...(item.lensSelection || {}), ...lensSelection } }
          : item
      );
      if (!user) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      const fullLenses = { ...(item?.lensSelection || {}), ...lensSelection };
      upsertCartItem(user.uid, pid, item?.quantity || 1, fullLenses, item?.cartVariantKey || item?.firebaseId).catch(() => loadCart());
    }
  };

  // ─── Remove from Cart ─────────────────────────────────────────────────────────
  const removeFromCart = async (identifier) => {
    const item = cart.find(i => matchesIdentifier(i, identifier));
    const cartDocId = item?.firebaseId || item?.cartVariantKey || item?.product_id || item?.id || identifier;

    // Optimistic UI Update
    setCart(prev => {
      const updated = prev.filter(i => !matchesIdentifier(i, identifier));
      if (!user) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    // Async Firebase Sync
    if (user && cartDocId) {
      removeCartItem(user.uid, cartDocId).catch(() => loadCart());
    }
  };

  // ─── Update Quantity ──────────────────────────────────────────────────────────
  const updateQuantity = async (identifier, quantity) => {
    if (quantity < 1) { removeFromCart(identifier); return; }
    
    // Optimistic UI Update
    setCart(prev => {
      const updated = prev.map(i =>
        matchesIdentifier(i, identifier)
          ? { ...i, quantity }
          : i
      );
      if (!user) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    // Async Firebase Sync
    const item = cart.find(i => matchesIdentifier(i, identifier));
    if (user && item) {
      const pid = item.product_id || item.id;
      upsertCartItem(user.uid, pid, quantity, item.lensSelection, item.cartVariantKey || item.firebaseId).catch(() => loadCart());
    }
  };

  // ─── Clear Cart ───────────────────────────────────────────────────────────────
  const emptyCart = async () => {
    if (user) await clearFirebaseCart(user.uid);
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    setDiscount({ amount: 0, code: null });
    setActiveCouponData(null);
  };

  // ─── Coupon Logic ─────────────────────────────────────────────────────────────
  const applyCoupon = async (code) => {
    const { data: coupon, error } = await validateCoupon(code);
    
    if (coupon) {
      const minPurchase = Number(coupon.min_purchase || 0);
      if (cartTotal < minPurchase) {
        return { success: false, message: `Add ₹${(minPurchase - cartTotal).toFixed(0)} more to use this coupon.` };
      }

      const isBogoCode = coupon.is_bogo || code.toUpperCase().includes('BOGO') || code.toUpperCase().includes('BUY1GET1');
      if (isBogoCode) {
        const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        if (totalQty < 2) {
          return { success: false, message: "Add at least 2 products to the cart to apply BOGO offer." };
        }
      }

      setActiveCouponData(coupon);

      let initialDiscount = 0;
      if (isBogoCode) {
        const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const allPrices = [];
        cart.forEach(item => {
          const itemPrice = getFullItemPrice(item);
          for (let i = 0; i < (item.quantity || 1); i++) {
            allPrices.push(itemPrice);
          }
        });
        allPrices.sort((a, b) => a - b);
        const freeCount = Math.floor(totalQty / 2);
        for (let i = 0; i < freeCount; i++) {
          initialDiscount += allPrices[i] || 0;
        }
      } else {
        const rawPct = Number(coupon.discount_percentage || 0);
        const pct = rawPct > 1 ? rawPct / 100 : rawPct;
        initialDiscount = cartTotal * pct;
        const maxDiscount = Number(coupon.max_discount || 0);
        if (maxDiscount > 0) initialDiscount = Math.min(initialDiscount, maxDiscount);
      }

      setDiscount({ amount: initialDiscount, code: code.toUpperCase() });
      return { success: true, message: `Coupon applied! You save ₹${initialDiscount.toFixed(0)}` };
    }
    
    return { success: false, message: error || 'Invalid or expired coupon code.' };
  };

  const removeCoupon = () => {
    setDiscount({ amount: 0, code: null });
    setActiveCouponData(null);
  };

  // ─── Computed Values ──────────────────────────────────────────────────────────
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const cartTotal = cart.reduce((total, item) => {
    return total + getFullItemPrice(item) * (item.quantity || 1);
  }, 0);

  // Auto recalculate discount when cart/total changes
  useEffect(() => {
    if (activeCouponData) {
      const code = activeCouponData.code;
      const minPurchase = Number(activeCouponData.min_purchase || 0);
      
      if (cartTotal < minPurchase) {
        setDiscount({ amount: 0, code: null });
        setActiveCouponData(null);
        toast.error(`Coupon removed: Add ₹${(minPurchase - cartTotal).toFixed(0)} more to use.`);
        return;
      }

      const isBogoCode = activeCouponData.is_bogo || code.toUpperCase().includes('BOGO') || code.toUpperCase().includes('BUY1GET1');
      if (isBogoCode) {
        const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        if (totalQty < 2) {
          setDiscount({ amount: 0, code: null });
          setActiveCouponData(null);
          toast.error("Coupon removed: Add at least 2 items to use the BOGO offer.");
          return;
        }

        const allPrices = [];
        cart.forEach(item => {
          const itemPrice = getFullItemPrice(item);
          for (let i = 0; i < (item.quantity || 1); i++) {
            allPrices.push(itemPrice);
          }
        });

        allPrices.sort((a, b) => a - b);
        const freeCount = Math.floor(totalQty / 2);
        let bogoDiscount = 0;
        for (let i = 0; i < freeCount; i++) {
          bogoDiscount += allPrices[i] || 0;
        }

        setDiscount({ amount: bogoDiscount, code: code.toUpperCase() });
      } else {
        const rawPct = Number(activeCouponData.discount_percentage || 0);
        const pct = rawPct > 1 ? rawPct / 100 : rawPct;
        let amount = cartTotal * pct;
        const maxDiscount = Number(activeCouponData.max_discount || 0);
        if (maxDiscount > 0) amount = Math.min(amount, maxDiscount);

        setDiscount({ amount, code: code.toUpperCase() });
      }
    } else {
      setDiscount({ amount: 0, code: null });
    }
  }, [cart, cartTotal, activeCouponData]);

  const tax = 0;
  const finalTotal = cartTotal - (discount.amount || 0);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      isCartOpen,
      toggleCart,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateLensSelection,
      emptyCart,
      getItemPrice,
      cartCount,
      cartTotal,
      tax,
      discount,
      finalTotal,
      applyCoupon,
      removeCoupon,
      loadCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
