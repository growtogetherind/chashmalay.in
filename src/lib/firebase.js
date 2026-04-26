import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, orderBy, limit, serverTimestamp, increment, runTransaction } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Products ---
export const getProducts = async ({ category, shape, priceMin, priceMax, isFeatured, sortBy = 'created_at', adminFilter = false } = {}) => {
  let q = adminFilter ? query(collection(db, "products")) : query(collection(db, "products"), where("is_active", "==", true));
  if (category) q = query(q, where("category", "==", category));
  if (shape) q = query(q, where("shape", "==", shape));
  if (isFeatured !== undefined) q = query(q, where("is_featured", "==", isFeatured));
  
  const querySnapshot = await getDocs(q);
  let products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (priceMin) products = products.filter(p => p.price >= priceMin);
  if (priceMax) products = products.filter(p => p.price <= priceMax);

  if (sortBy === 'price_asc') products.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price_desc') products.sort((a, b) => b.price - a.price);
  else products.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

  return { data: products, error: null };
};

export const getProductById = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "products", id));
    if (docSnap.exists()) {
      const reviewsQ = query(collection(db, "reviews"), where("product_id", "==", id));
      const reviewsSnap = await getDocs(reviewsQ);
      const reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      return { data: { ...docSnap.data(), id: docSnap.id, reviews }, error: null };
    }
    return { data: null, error: "Product not found" };
  } catch (error) { return { data: null, error }; }
};

export const saveProduct = async (product, id = null) => {
  try {
    if (id) {
      await updateDoc(doc(db, "products", id), { ...product, updated_at: serverTimestamp() });
    } else {
      await addDoc(collection(db, "products"), { ...product, created_at: serverTimestamp(), sku: `SKU-${Date.now()}` });
    }
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, "products", id));
    return { error: null };
  } catch (error) { return { error }; }
};

export const uploadProductImage = async (file, path) => {
  if (!file) return { url: null, error: "No file provided" };
  try {
    const storageRef = ref(storage, `products/${path}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { url, error: null };
  } catch (error) {
    return { url: null, error };
  }
};

// --- Cart ---
export const getCartItems = async (userId) => {
  try {
    const q = query(collection(db, "cart_items"), where("user_id", "==", userId));
    const querySnapshot = await getDocs(q);
    const items = await Promise.all(querySnapshot.docs.map(async (d) => {
      const item = d.data();
      const productSnap = await getDoc(doc(db, "products", item.product_id));
      return { id: d.id, ...item, products: productSnap.data() };
    }));
    return { data: items, error: null };
  } catch (error) { return { data: null, error }; }
};

export const upsertCartItem = async (userId, productId, quantity, lensSelection = null) => {
  try {
    const id = `${userId}_${productId}`;
    await setDoc(doc(db, "cart_items", id), {
      user_id: userId,
      product_id: productId,
      quantity,
      lens_selection: lensSelection,
      updated_at: serverTimestamp()
    }, { merge: true });
    return { error: null };
  } catch (error) { return { error }; }
};

export const removeCartItem = async (userId, productId) => {
  try {
    const id = `${userId}_${productId}`;
    await deleteDoc(doc(db, "cart_items", id));
    return { error: null };
  } catch (error) { return { error }; }
};

export const emptyCart = async (userId) => {
  try {
    const q = query(collection(db, "cart_items"), where("user_id", "==", userId));
    const querySnapshot = await getDocs(q);
    await Promise.all(querySnapshot.docs.map(d => deleteDoc(d.ref)));
    return { error: null };
  } catch (error) { return { error }; }
};

// --- Profiles ---
export const getProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, "profiles", userId));
    return { data: docSnap.exists() ? docSnap.data() : null, error: null };
  } catch (error) { return { data: null, error }; }
};

export const updateProfile = async (userId, updates) => {
  try {
    await setDoc(doc(db, "profiles", userId), { ...updates, updated_at: serverTimestamp() }, { merge: true });
    return { error: null };
  } catch (error) { return { error }; }
};

// --- Orders ---
export const createOrder = async ({ userId, items, total, address, paymentId }) => {
  try {
    const orderData = {
      user_id: userId,
      total_amount: total,
      shipping_address: address,
      razorpay_payment_id: paymentId,
      status: 'confirmed',
      created_at: serverTimestamp()
    };
    const orderRef = await addDoc(collection(db, "orders"), orderData);

    const batchPromises = items.map(async (item) => {
      const pid = item.product_id || item.id;
      const qty = item.quantity || 1;

      if (pid && !pid.startsWith('custom-')) {
        try {
          // Use a transaction to check stock BEFORE decrementing (prevents overselling)
          await runTransaction(db, async (transaction) => {
            const productRef = doc(db, "products", pid);
            const productSnap = await transaction.get(productRef);
            if (!productSnap.exists()) return; // Product deleted — skip silently
            const currentStock = productSnap.data().stock_quantity ?? 0;
            if (currentStock < qty) {
              // Stock ran out before their purchase; we log but do not throw
              // (payment is already captured — must not break the order).
              // Admin will see the negative stock and can resolve manually.
              console.warn(`Low stock for ${pid}: requested ${qty}, available ${currentStock}`);
            }
            transaction.update(productRef, {
              stock_quantity: increment(-qty),
              updated_at: serverTimestamp()
            });
          });
        } catch (stockError) {
          console.error(`FAILED to decrement stock for ${pid}:`, stockError);
        }
      }

      const basePrice = parseInt((item.price || item.consumersPrice || "0").toString().replace(/,/g, ''));
      let lensTotal = 0;
      if (item.lensSelection?.visionType) lensTotal += item.lensSelection.visionType.price;
      if (item.lensSelection?.lensPackage) lensTotal += item.lensSelection.lensPackage.price;
      const finalItemPrice = basePrice + lensTotal;

      return addDoc(collection(db, "order_items"), {
        order_id: orderRef.id,
        product_id: pid || `custom-${Date.now()}`,
        quantity: qty,
        price: finalItemPrice,
        product_name: item.name || 'Premium Eyewear',
        frame_image: item.frame_image || item.frameImage || item.gallery?.[0] || '',
        lens_selection: item.lensSelection || null
      });
    });
    await Promise.all(batchPromises);
    return { id: orderRef.id, ...orderData };
  } catch (error) { throw error; }
};

export const getUserOrders = async (userId) => {
  try {
    const q = query(collection(db, "orders"), where("user_id", "==", userId));
    const querySnapshot = await getDocs(q);
    const orders = await Promise.all(querySnapshot.docs.map(async (d) => {
      const order = { id: d.id, ...d.data() };
      const itemsQ = query(collection(db, "order_items"), where("order_id", "==", d.id));
      const itemsSnap = await getDocs(itemsQ);
      order.order_items = await Promise.all(itemsSnap.docs.map(async (itemDoc) => {
        const item = itemDoc.data();
        let pSnap = await getDoc(doc(db, "products", item.product_id));
        
        // Resilience: If product not found, check if ID was a composite userId_productId
        if (!pSnap.exists() && item.product_id?.includes('_')) {
          const actualId = item.product_id.split('_')[1];
          pSnap = await getDoc(doc(db, "products", actualId));
        }

        return { ...item, products: pSnap.exists() ? pSnap.data() : null };
      }));
      return order;
    }));
    orders.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
    return { data: orders, error: null };
  } catch (error) { return { data: null, error }; }
};

export const getOrderById = async (orderId) => {
  try {
    const docSnap = await getDoc(doc(db, "orders", orderId));
    if (docSnap.exists()) {
      const order = { id: docSnap.id, ...docSnap.data() };
      const itemsQ = query(collection(db, "order_items"), where("order_id", "==", orderId));
      const itemsSnap = await getDocs(itemsQ);
      order.order_items = await Promise.all(itemsSnap.docs.map(async (itemDoc) => {
        const item = itemDoc.data();
        let pSnap = await getDoc(doc(db, "products", item.product_id));
        
        // Resilience: If product not found, check if ID was a composite userId_productId
        if (!pSnap.exists() && item.product_id?.includes('_')) {
          const actualId = item.product_id.split('_')[1];
          pSnap = await getDoc(doc(db, "products", actualId));
        }

        return { ...item, products: pSnap.exists() ? pSnap.data() : null };
      }));
      return { data: order, error: null };
    }
    return { data: null, error: "Order not found" };
  } catch (error) { return { data: null, error }; }
};

export const getAllOrders = async () => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "orders"), orderBy("created_at", "desc")));
    const orders = await Promise.all(querySnapshot.docs.map(async (d) => {
      const order = { id: d.id, ...d.data() };
      const pSnap = await getDoc(doc(db, "profiles", order.user_id));
      order.profiles = pSnap.exists() ? pSnap.data() : null;
      const itemsQ = query(collection(db, "order_items"), where("order_id", "==", d.id));
      const itemsSnap = await getDocs(itemsQ);
      order.order_items = await Promise.all(itemsSnap.docs.map(async (itemDoc) => {
        const item = itemDoc.data();
        let pSnap = await getDoc(doc(db, "products", item.product_id));
        if (!pSnap.exists() && item.product_id?.includes('_')) {
          const actualId = item.product_id.split('_')[1];
          pSnap = await getDoc(doc(db, "products", actualId));
        }
        return { ...item, products: pSnap.exists() ? pSnap.data() : null };
      }));
      return order;
    }));
    return { data: orders, error: null };
  } catch (error) { return { data: null, error }; }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    // 1. Update the order status
    await updateDoc(doc(db, "orders", orderId), { status, updated_at: serverTimestamp() });

    // 2. If status is cancelled, restore stock
    if (status === 'cancelled') {
      const itemsQ = query(collection(db, "order_items"), where("order_id", "==", orderId));
      const itemsSnap = await getDocs(itemsQ);
      
      const batchPromises = itemsSnap.docs.map(async (itemDoc) => {
        const item = itemDoc.data();
        const pid = item.product_id;
        if (pid && !pid.startsWith('custom-')) {
          try {
            await updateDoc(doc(db, "products", pid), {
              stock_quantity: increment(item.quantity || 1)
            });
          } catch (e) {
            console.warn(`Could not restore stock for ${pid}:`, e);
          }
        }
      });
      await Promise.all(batchPromises);
    }
    
    return { error: null };
  } catch (error) { 
    return { error }; 
  }
};

export const getDashboardStats = async () => {
  try {
    const [ordersSnap, productsSnap, profilesSnap] = await Promise.all([
      getDocs(query(collection(db, "orders"), orderBy("created_at", "desc"))),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "profiles"))
    ]);

    const orders = await Promise.all(ordersSnap.docs.map(async (d) => {
      const order = { id: d.id, ...d.data() };
      const pSnap = await getDoc(doc(db, "profiles", order.user_id));
      order.profiles = pSnap.exists() ? pSnap.data() : null;
      return order;
    }));

    const revenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    return {
      data: {
        orders: orders,
        orderCount: orders.length,
        productCount: productsSnap.size,
        profileCount: profilesSnap.size,
        revenue
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const getAllProfiles = async () => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "profiles"), orderBy("created_at", "desc")));
    const profiles = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { data: profiles, error: null };
  } catch (error) { return { data: null, error }; }
};

export const updateProductStock = async (productId, quantity) => {
  try {
    await updateDoc(doc(db, "products", productId), {
      stock_quantity: Number(quantity),
      updated_at: serverTimestamp()
    });
    return { error: null };
  } catch (error) { return { error }; }
};

export const toggleProductActive = async (productId, isActive) => {
  try {
    await updateDoc(doc(db, "products", productId), {
      is_active: isActive,
      updated_at: serverTimestamp()
    });
    return { error: null };
  } catch (error) { return { error }; }
};

export const addOrderNote = async (orderId, note) => {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      admin_note: note,
      updated_at: serverTimestamp()
    });
    return { error: null };
  } catch (error) { return { error }; }
};

// ─── Reviews & Ratings ────────────────────────────────────────────────────────
export const addReview = async (productId, userId, rating, comment, userInfo) => {
  try {
    const reviewData = {
      product_id: productId,
      user_id: userId,
      rating: Number(rating),
      comment,
      // FIX: Only store display name — never email in a publicly readable collection
      reviewer_name: userInfo?.full_name || 'Anonymous Customer',
      created_at: serverTimestamp()
    };
    await addDoc(collection(db, "reviews"), reviewData);
    
    const pSnap = await getDoc(doc(db, "products", productId));
    if (pSnap.exists()) {
      const pData = pSnap.data();
      const currentCount = pData.reviewCount || 0;
      const currentRating = pData.rating || 5;
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + Number(rating)) / newCount;
      
      await updateDoc(doc(db, "products", productId), {
        reviewCount: newCount,
        rating: Math.round(newRating * 10) / 10
      });
    }

    return { error: null };
  } catch (error) { return { error }; }
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const getCoupons = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "coupons"));
    const coupons = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort locally to avoid index Requirement
    coupons.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
    return { data: coupons, error: null };
  } catch (error) { 
    console.error("Firebase Coupon Error:", error);
    return { data: null, error }; 
  }
};

export const createCoupon = async (couponData) => {
  try {
    await addDoc(collection(db, "coupons"), {
      ...couponData,
      code: couponData.code.toUpperCase(),
      created_at: serverTimestamp()
    });
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteCoupon = async (id) => {
  try {
    await deleteDoc(doc(db, "coupons", id));
    return { error: null };
  } catch (error) { return { error }; }
};

export const validateCoupon = async (code) => {
  try {
    const q = query(collection(db, "coupons"), where("code", "==", code.toUpperCase()), where("is_active", "==", true));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { data: { id: snap.docs[0].id, ...snap.docs[0].data() }, error: null };
    }
    return { data: null, error: "Invalid or expired coupon" };
  } catch (error) { return { data: null, error }; }
};

// ─── Offers Management ────────────────────────────────────────────────────────
export const getOffers = async () => {
  try {
    const q = query(collection(db, "offers"), orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) { return { data: null, error }; }
};

export const saveOffer = async (offer, id = null) => {
  try {
    if (id) {
      await updateDoc(doc(db, "offers", id), { ...offer, updated_at: serverTimestamp() });
    } else {
      await addDoc(collection(db, "offers"), { ...offer, created_at: serverTimestamp() });
    }
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteOffer = async (id) => {
  try {
    await deleteDoc(doc(db, "offers", id));
    return { error: null };
  } catch (error) { return { error }; }
};

// ─── Carousel Management ──────────────────────────────────────────────────────
export const getCarouselItems = async () => {
  try {
    const q = query(collection(db, "carousel"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) { return { data: null, error }; }
};

export const saveCarouselItem = async (item, id = null) => {
  try {
    if (id) {
      await updateDoc(doc(db, "carousel", id), { ...item, updated_at: serverTimestamp() });
    } else {
      await addDoc(collection(db, "carousel"), { ...item, created_at: serverTimestamp() });
    }
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteCarouselItem = async (id) => {
  try {
    await deleteDoc(doc(db, "carousel", id));
    return { error: null };
  } catch (error) { return { error }; }
};

export const uploadGenericImage = async (file, folder) => {
  if (!file) return { url: null, error: "No file provided" };
  try {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return { url: await getDownloadURL(snapshot.ref), error: null };
  } catch (error) { 
    console.error("DEBUG: Upload Error:", error);
    return { url: null, error: error.message || error }; 
  }
};
