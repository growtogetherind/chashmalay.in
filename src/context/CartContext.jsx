import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getCartItems, upsertCartItem, removeCartItem, emptyCart as clearFirebaseCart, validateCoupon } from '../lib/firebase';
import toast from 'react-hot-toast';

const CartContext = createContext({});
export const useCart = () => useContext(CartContext);

const CART_STORAGE_KEY = 'chashmaly_guest_cart';

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState({ amount: 0, code: null });

  // ─── Unified price reader ─────────────────────────────────────────────────────
  // Handles both Firebase cart items (item.products.price) and guest items (item.price)
  const getItemPrice = (item) => {
    const priceRaw = item?.products?.price ?? item?.consumersPrice ?? item?.price ?? 0;
    const priceStr = priceRaw.toString().replace(/,/g, '');
    const parsed = parseFloat(priceStr);
    return isNaN(parsed) ? 0 : parsed;
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
            if (pid) await upsertCartItem(user.uid, pid, item.quantity || 1, item.lensSelection);
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
    // Sanitize to avoid circular refs from React elements which break Firebase (Internal Assertion Failed: Symbol)
    const sanitizedLenses = lensSelection ? {
      visionType: lensSelection.visionType
        ? { id: lensSelection.visionType.id, title: lensSelection.visionType.title, price: lensSelection.visionType.price }
        : null,
      lensPackage: lensSelection.lensPackage
        ? { id: lensSelection.lensPackage.id, name: lensSelection.lensPackage.name, price: lensSelection.lensPackage.price }
        : null
    } : null;

    if (user) {
      const existing = cart.find(item => (item.product_id || item.id) === product.id);
      const qty = existing ? (existing.quantity || 1) + 1 : 1;
      const { error } = await upsertCartItem(user.uid, product.id, qty, sanitizedLenses);
      if (error) { toast.error('Could not add to cart.'); return; }
      await loadCart();
    } else {

      setCart(prev => {
        const existingIdx = prev.findIndex(item => (item.id || item.product_id) === product.id);
        let updated;
        if (existingIdx >= 0) {
          updated = prev.map((item, i) =>
            i === existingIdx ? { ...item, quantity: (item.quantity || 1) + 1 } : item
          );
        } else {
          updated = [...prev, {
            // Preserve all product fields at root level
            ...product,
            product_id: product.id,
            quantity: 1,
            lensSelection: sanitizedLenses,
            cartId: `${product.id}-${Date.now()}`
          }];
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
    toast.success(`${product.name || 'Item'} added to cart!`, { icon: '🛍️' });
  };

  // ─── Remove from Cart ─────────────────────────────────────────────────────────
  // Accepts any identifier: cartId, product_id, or id
  const removeFromCart = async (identifier) => {
    const findItem = (list) => list.find(
      item => item.cartId === identifier || item.product_id === identifier || item.id === identifier
    );

    if (user) {
      const item = findItem(cart);
      const pid = item?.product_id || item?.id || identifier;
      await removeCartItem(user.uid, pid);
      setCart(prev => prev.filter(i =>
        i.cartId !== identifier && i.product_id !== identifier && i.id !== identifier
      ));
    } else {
      setCart(prev => {
        const updated = prev.filter(i =>
          i.cartId !== identifier && i.product_id !== identifier && i.id !== identifier
        );
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  };

  // ─── Update Quantity ──────────────────────────────────────────────────────────
  const updateQuantity = async (identifier, quantity) => {
    if (quantity < 1) { removeFromCart(identifier); return; }
    const item = cart.find(i =>
      i.cartId === identifier || i.product_id === identifier || i.id === identifier
    );
    if (user && item) {
      await upsertCartItem(user.uid, item.product_id || item.id, quantity);
    }
    setCart(prev => {
      const updated = prev.map(i =>
        (i.cartId === identifier || i.product_id === identifier || i.id === identifier)
          ? { ...i, quantity }
          : i
      );
      if (!user) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // ─── Clear Cart ───────────────────────────────────────────────────────────────
  const emptyCart = async () => {
    if (user) await clearFirebaseCart(user.uid);
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    setDiscount({ amount: 0, code: null });
  };

  // ─── Coupon Logic ─────────────────────────────────────────────────────────────
  const applyCoupon = async (code) => {
    const { data: coupon, error } = await validateCoupon(code);
    
    if (coupon) {
      const pct = coupon.discount_percentage; // E.g. 0.25
      const amount = cartTotal * pct;
      setDiscount({ amount, code: code.toUpperCase() });
      return { success: true, message: `Coupon applied! You save ₹${amount.toFixed(0)}` };
    }
    
    return { success: false, message: error || 'Invalid or expired coupon code.' };
  };

  const removeCoupon = () => setDiscount({ amount: 0, code: null });

  // ─── Computed Values ──────────────────────────────────────────────────────────
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const cartTotal = cart.reduce((total, item) => {
    let itemPrice = getItemPrice(item);
    // Add lens selection costs for guest cart
    if (item.lensSelection?.visionType?.price) itemPrice += item.lensSelection.visionType.price;
    if (item.lensSelection?.lensPackage?.price) itemPrice += item.lensSelection.lensPackage.price;
    return total + itemPrice * (item.quantity || 1);
  }, 0);

  const tax = Math.round(cartTotal * 0.18);
  const finalTotal = cartTotal + tax - (discount.amount || 0);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
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
