import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, orderBy, limit, serverTimestamp, increment, runTransaction, onSnapshot } from "firebase/firestore";

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

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value.toString().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

const getTimestamp = (val) => {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (val.seconds) return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
  return 0;
};

const byCreatedDesc = (a, b) => getTimestamp(b.created_at) - getTimestamp(a.created_at);
const byNameAsc = (a, b) => (a.full_name || a.name || '').localeCompare(b.full_name || b.name || '');

const DEFAULT_SETTINGS = {
  store_name: 'Chashmalay',
  contact_email: 'info@chashmalay.in',
  contact_phone: '+91-9319484119',
  address: 'Karol Bagh, New Delhi - 110005, India',
  instagram: '#',
  facebook: '#',
  twitter: '#',
  free_shipping_min: 0,
  maintenance_mode: false,
  store_logo: '',
  carousel_interval: 5
};

export const getProductImage = (product = {}) => (
  product.images?.front ||
  product.frame_image ||
  product.frameImage ||
  product.image ||
  product.images?.gallery?.[0] ||
  product.gallery?.[0] ||
  ''
);

export const normalizeProduct = (product = {}) => {
  const gallery = Array.isArray(product.images?.gallery)
    ? product.images.gallery.filter(Boolean)
    : Array.isArray(product.gallery)
      ? product.gallery.filter(Boolean)
      : [];
  const front = product.images?.front || product.frame_image || product.frameImage || product.image || gallery[0] || '';
  const side = product.images?.side || '';
  const model = product.images?.model || product.model_image || '';
  const zoom = product.images?.zoom || '';

  return {
    ...product,
    price: toNumber(product.price ?? product.consumersPrice),
    original_price: product.original_price ? toNumber(product.original_price) : (product.originalPrice ? toNumber(product.originalPrice) : null),
    discount_price: product.discount_price ? toNumber(product.discount_price) : null,
    stock_quantity: toNumber(product.stock_quantity, 0),
    is_active: product.is_active !== false,
    available_sizes: Array.isArray(product.available_sizes) && product.available_sizes.length ? product.available_sizes : ['M'],
    available_lenses: Array.isArray(product.available_lenses) ? product.available_lenses : [],
    colors: Array.isArray(product.colors) ? product.colors : [],
    images: {
      ...(product.images || {}),
      front,
      side,
      model,
      zoom,
      gallery,
    },
    frame_image: front,
    frameImage: front,
    gallery: Array.from(new Set([front, side, model, zoom, ...gallery].filter(Boolean))),
  };
};

const productPayload = (product = {}) => {
  const normalized = normalizeProduct(product);
  const { id, gallery, frameImage, originalPrice, consumersPrice, ...payload } = normalized;
  return payload;
};

const subscribeToQuery = (q, onData, onError, mapper = mapDoc) => onSnapshot(
  q,
  (snapshot) => onData(snapshot.docs.map((d) => mapper(d))),
  (error) => {
    console.error("Firestore subscription error:", error);
    if (onError) onError(error);
  }
);

// --- Client-Side Rate Limiter ---
// Prevents rapid duplicate requests from the same client session
const actionLimits = new Map();
const checkRateLimit = (action, limitMs = 5000) => {
  const now = Date.now();
  const lastAction = actionLimits.get(action) || 0;
  if (now - lastAction < limitMs) return false;
  actionLimits.set(action, now);
  return true;
};

// --- Products ---
export const getProducts = async ({ category, shape, priceMin, priceMax, isFeatured, isNew, sortBy = 'created_at', adminFilter = false } = {}) => {
  try {
    let q = adminFilter ? query(collection(db, "products")) : query(collection(db, "products"), where("is_active", "==", true));
    if (category) q = query(q, where("category", "==", category));
    if (shape) q = query(q, where("shape", "==", shape));
    if (isFeatured !== undefined) q = query(q, where("is_featured", "==", isFeatured));
    if (isNew !== undefined) q = query(q, where("is_new", "==", isNew));

    const querySnapshot = await getDocs(q);
    let products = querySnapshot.docs.map(doc => normalizeProduct({ id: doc.id, ...doc.data() }));

    if (priceMin) products = products.filter(p => p.price >= priceMin);
    if (priceMax) products = products.filter(p => p.price <= priceMax);

    if (sortBy === 'price_asc') products.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') products.sort((a, b) => b.price - a.price);
    else products.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

    return { data: products, error: null };
  } catch (error) {
    console.error("Firebase getProducts error:", error);
    return { data: [], error };
  }
};

export const subscribeProducts = ({ category, shape, priceMin, priceMax, isFeatured, isNew, sortBy = 'created_at', adminFilter = false } = {}, onData, onError) => {
  let q = adminFilter ? query(collection(db, "products")) : query(collection(db, "products"), where("is_active", "==", true));
  if (category) q = query(q, where("category", "==", category));
  if (shape) q = query(q, where("shape", "==", shape));
  if (isFeatured !== undefined) q = query(q, where("is_featured", "==", isFeatured));
  if (isNew !== undefined) q = query(q, where("is_new", "==", isNew));

  return subscribeToQuery(q, (items) => {
    let products = items.map(normalizeProduct);
    if (priceMin) products = products.filter(p => p.price >= priceMin);
    if (priceMax) products = products.filter(p => p.price <= priceMax);
    if (sortBy === 'price_asc') products.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') products.sort((a, b) => b.price - a.price);
    else products.sort(byCreatedDesc);
    onData(products);
  }, onError);
};

export const getProductById = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "products", id));
    if (docSnap.exists()) {
      const reviewsQ = query(collection(db, "reviews"), where("product_id", "==", id));
      const reviewsSnap = await getDocs(reviewsQ);
      const reviews = reviewsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((review) => review.status === 'approved');
      return { data: normalizeProduct({ ...docSnap.data(), id: docSnap.id, reviews }), error: null };
    }
    return { data: null, error: "Product not found" };
  } catch (error) { return { data: null, error }; }
};

export const saveProduct = async (product, id = null) => {
  try {
    const payload = productPayload(product);
    if (id) {
      await updateDoc(doc(db, "products", id), { ...payload, updated_at: serverTimestamp() });
    } else {
      await addDoc(collection(db, "products"), {
        ...payload,
        created_at: serverTimestamp(),
        sku: payload.sku || `SKU-${Date.now()}`,
        status: payload.status || 'active'
      });
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



// --- Cart ---
export const getCartItems = async (userId) => {
  try {
    const q = query(collection(db, "cart_items"), where("user_id", "==", userId));
    const querySnapshot = await getDocs(q);
    const items = await Promise.all(querySnapshot.docs.map(async (d) => {
      const item = d.data();
      const productSnap = await getDoc(doc(db, "products", item.product_id));
      return { id: d.id, ...item, products: productSnap.exists() ? normalizeProduct({ id: productSnap.id, ...productSnap.data() }) : null };
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
  if (!checkRateLimit(`createOrder_${userId}`, 10000)) {
    throw new Error("Please wait before placing another order.");
  }
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

    // Send Telegram Notification (Optional but recommended)
    sendTelegramNotification(`🚀 *New Order Received!*\n\n*Order ID:* #${orderRef.id.slice(0, 8).toUpperCase()}\n*Amount:* ₹${Number(total).toLocaleString()}\n*Customer:* ${address.name}\n*City:* ${address.city}`);

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
        frame_image: getProductImage(item),
        category: item.category || '',
        brand: item.brand || '',
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

        return { ...item, products: pSnap.exists() ? normalizeProduct({ id: pSnap.id, ...pSnap.data() }) : null };
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

        return { ...item, products: pSnap.exists() ? normalizeProduct({ id: pSnap.id, ...pSnap.data() }) : null };
      }));
      return { data: order, error: null };
    }
    return { data: null, error: "Order not found" };
  } catch (error) { return { data: null, error }; }
};

export const getAllOrders = async () => {
  try {
    const querySnapshot = await getDocs(query(collection(db, "orders"), orderBy("created_at", "desc")));
    const orders = await Promise.all(querySnapshot.docs.map((d) => hydrateOrder(mapDoc(d))));
    return { data: orders, error: null };
  } catch (error) { return { data: null, error }; }
};

const hydrateOrder = async (order) => {
  const pSnap = order.user_id ? await getDoc(doc(db, "profiles", order.user_id)) : null;
  const itemsQ = query(collection(db, "order_items"), where("order_id", "==", order.id));
  const itemsSnap = await getDocs(itemsQ);
  const order_items = await Promise.all(itemsSnap.docs.map(async (itemDoc) => {
    const item = { id: itemDoc.id, ...itemDoc.data() };
    let productSnap = item.product_id && !item.product_id.startsWith('custom-')
      ? await getDoc(doc(db, "products", item.product_id))
      : null;
    if (productSnap && !productSnap.exists() && item.product_id?.includes('_')) {
      const actualId = item.product_id.split('_')[1];
      productSnap = await getDoc(doc(db, "products", actualId));
    }
    return { ...item, products: productSnap?.exists() ? normalizeProduct({ id: productSnap.id, ...productSnap.data() }) : null };
  }));
  return {
    ...order,
    profiles: pSnap?.exists() ? pSnap.data() : null,
    order_items,
  };
};

export const subscribeAllOrders = (onData, onError) => subscribeToQuery(
  query(collection(db, "orders"), orderBy("created_at", "desc")),
  async (orders) => {
    const hydrated = await Promise.all(orders.map(hydrateOrder));
    onData(hydrated);
  },
  onError
);

export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderSnap = await getDoc(doc(db, "orders", orderId));
    const previousStatus = orderSnap.exists() ? orderSnap.data().status : null;
    // 1. Update the order status
    await updateDoc(doc(db, "orders", orderId), { status, updated_at: serverTimestamp() });

    // 2. If status is cancelled, restore stock
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
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

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

export const getDashboardStats = async () => {
  try {
    const [ordersSnap, productsSnap, profilesSnap] = await Promise.all([
      getDocs(query(collection(db, "orders"), orderBy("created_at", "desc"))),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "profiles"))
    ]);

    const ordersRaw = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const orders = await Promise.all(ordersRaw.map(async (o) => {
       const pSnap = await getDoc(doc(db, "profiles", o.user_id));
       return { ...o, profiles: pSnap.exists() ? pSnap.data() : null };
    }));
    const revenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const lowStockProducts = productsSnap.docs.filter(d => (d.data().stock_quantity || 0) <= 10).length;

    return {
      data: {
        orders: orders,
        orderCount: orders.length,
        productCount: productsSnap.size,
        profileCount: profilesSnap.size,
        revenue,
        pendingOrders,
        lowStockProducts
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const subscribeDashboardStats = (onData, onError) => {
  let latestOrders = [];
  let latestProducts = [];
  let latestProfiles = [];

  const emit = () => {
    const revenue = latestOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    onData({
      orders: latestOrders,
      orderCount: latestOrders.length,
      productCount: latestProducts.length,
      profileCount: latestProfiles.length,
      revenue,
      pendingOrders: latestOrders.filter(o => ['pending', 'confirmed'].includes(o.status)).length,
      lowStockProducts: latestProducts.filter(p => (p.stock_quantity || 0) <= 10).length,
    });
  };

  const unsubs = [
    subscribeAllOrders((orders) => { latestOrders = orders; emit(); }, onError),
    subscribeProducts({ adminFilter: true }, (products) => { latestProducts = products; emit(); }, onError),
    subscribeAllProfiles((profiles) => { latestProfiles = profiles; emit(); }, onError),
  ];

  return () => unsubs.forEach((unsubscribe) => unsubscribe?.());
};

// --- Categories ---
export const getCategories = async () => {
  try {
    const q = query(collection(db, "categories"));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort manually to avoid index requirement
    data.sort(byNameAsc);
    return { data, error: null };
  } catch (error) {
    console.error("getCategories Error:", error);
    return { data: [], error };
  }
};

export const subscribeCategories = (onData, onError) => subscribeToQuery(
  collection(db, "categories"),
  (items) => onData(items.sort(byNameAsc)),
  onError
);

export const saveCategory = async (category, id = null) => {
  try {
    if (id) await updateDoc(doc(db, "categories", id), { ...category, updated_at: serverTimestamp() });
    else await addDoc(collection(db, "categories"), { ...category, created_at: serverTimestamp() });
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteCategory = async (id) => {
  try {
    await deleteDoc(doc(db, "categories", id));
    return { error: null };
  } catch (error) { return { error }; }
};

// --- Brands ---
export const getBrands = async () => {
  try {
    const q = query(collection(db, "brands"), orderBy("name", "asc"));
    const snap = await getDocs(q);
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) { return { data: [], error }; }
};

export const subscribeBrands = (onData, onError) => subscribeToQuery(
  query(collection(db, "brands"), orderBy("name", "asc")),
  onData,
  onError
);

export const saveBrand = async (brand, id = null) => {
  try {
    if (id) await updateDoc(doc(db, "brands", id), { ...brand, updated_at: serverTimestamp() });
    else await addDoc(collection(db, "brands"), { ...brand, created_at: serverTimestamp() });
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteBrand = async (id) => {
  try {
    await deleteDoc(doc(db, "brands", id));
    return { error: null };
  } catch (error) { return { error }; }
};

// --- Prescriptions ---
export const getPrescriptions = async (userId = null) => {
  try {
    let q = collection(db, "prescriptions");
    if (userId) q = query(q, where("user_id", "==", userId));
    const snap = await getDocs(query(q, orderBy("created_at", "desc")));
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) { return { data: [], error }; }
};

export const subscribePrescriptions = (onData, onError, userId = null) => {
  let q = collection(db, "prescriptions");
  if (userId) q = query(q, where("user_id", "==", userId));
  return subscribeToQuery(query(q, orderBy("created_at", "desc")), onData, onError);
};

export const savePrescription = async (data, id = null) => {
  try {
    if (id) await updateDoc(doc(db, "prescriptions", id), { ...data, updated_at: serverTimestamp() });
    else await addDoc(collection(db, "prescriptions"), { ...data, created_at: serverTimestamp() });
    return { error: null };
  } catch (error) { return { error }; }
};

// --- Settings ---
export const getSettings = async () => {
  try {
    const docSnap = await getDoc(doc(db, "settings", "global"));
    return { data: docSnap.exists() ? { ...DEFAULT_SETTINGS, ...docSnap.data() } : DEFAULT_SETTINGS, error: null };
  } catch (error) { return { data: DEFAULT_SETTINGS, error }; }
};

export const subscribeSettings = (onData, onError) => {
  onData(DEFAULT_SETTINGS);

  return onSnapshot(
    doc(db, "settings", "global"),
    (snapshot) => onData(snapshot.exists() ? { ...DEFAULT_SETTINGS, ...snapshot.data() } : DEFAULT_SETTINGS),
    (error) => {
      if (error?.code !== 'permission-denied') {
        console.error("Firestore settings subscription error:", error);
      }
      onData(DEFAULT_SETTINGS);
      if (onError) onError(error);
    }
  );
};

export const saveSettings = async (settings) => {
  try {
    await setDoc(doc(db, "settings", "global"), { ...settings, updated_at: serverTimestamp() }, { merge: true });
    return { error: null };
  } catch (error) { return { error }; }
};

export const toggleUserBlock = async (userId, isBlocked) => {
  try {
    await updateDoc(doc(db, "profiles", userId), {
      is_blocked: isBlocked,
      updated_at: serverTimestamp()
    });
    return { error: null };
  } catch (error) { return { error }; }
};
export const getAllProfiles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "profiles"));
    const profiles = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Manual sort if needed
    profiles.sort((a, b) => {
      const dateA = a.created_at?.seconds || 0;
      const dateB = b.created_at?.seconds || 0;
      return dateB - dateA;
    });
    return { data: profiles, error: null };
  } catch (error) { return { data: null, error }; }
};

export const subscribeAllProfiles = (onData, onError) => {
  return onSnapshot(
    collection(db, "profiles"),
    (snapshot) => {
      const data = snapshot.docs.map(mapDoc);
      // Sort in-memory to ensure documents missing 'created_at' are still shown (at the end)
      data.sort(byCreatedDesc);
      onData(data);
    },
    (error) => {
      console.error("subscribeAllProfiles error:", error);
      if (onError) onError(error);
    }
  );
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
  if (!checkRateLimit(`addReview_${userId}_${productId}`, 15000)) {
    return { error: "You are submitting reviews too quickly. Please wait." };
  }
  try {
    const reviewData = {
      product_id: productId,
      user_id: userId,
      rating: Number(rating),
      comment,
      // FIX: Only store display name — never email in a publicly readable collection
      reviewer_name: userInfo?.full_name || 'Anonymous Customer',
      product_name: userInfo?.product_name || '',
      status: 'pending',
      created_at: serverTimestamp()
    };
    await addDoc(collection(db, "reviews"), reviewData);

    return { error: null };
  } catch (error) { return { error }; }
};

export const getReviews = async () => {
  try {
    const q = query(collection(db, "reviews"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: reviews, error: null };
  } catch (error) {
    console.error("Firebase getReviews error:", error);
    return { data: [], error };
  }
};

export const subscribeReviews = (onData, onError) => subscribeToQuery(
  query(collection(db, "reviews"), orderBy("created_at", "desc")),
  onData,
  onError
);

export const subscribeProductReviews = (productId, onData, onError) => subscribeToQuery(
  query(
    collection(db, "reviews"), 
    where("product_id", "==", productId), 
    where("status", "==", "approved"),
    orderBy("created_at", "desc")
  ),
  onData,
  onError
);

export const updateReviewStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "reviews", id), { status, updated_at: serverTimestamp() });
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const deleteReview = async (id) => {
  try {
    await deleteDoc(doc(db, "reviews", id));
    return { error: null };
  } catch (error) {
    return { error };
  }
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

export const subscribeCoupons = (onData, onError) => subscribeToQuery(
  collection(db, "coupons"),
  (coupons) => onData(coupons.sort(byCreatedDesc)),
  onError
);

export const saveCoupon = async (couponData, id = null) => {
  try {
    const data = {
      ...couponData,
      code: couponData.code.toUpperCase(),
      updated_at: serverTimestamp()
    };
    if (id) {
      await updateDoc(doc(db, "coupons", id), data);
    } else {
      data.created_at = serverTimestamp();
      await addDoc(collection(db, "coupons"), data);
    }
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
      const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() };
      if (coupon.expiry_date) {
        const expiry = new Date(`${coupon.expiry_date}T23:59:59`);
        if (expiry.getTime() < Date.now()) {
          return { data: null, error: "Coupon has expired" };
        }
      }
      return { data: coupon, error: null };
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

export const subscribeOffers = (onData, onError) => subscribeToQuery(
  query(collection(db, "offers"), orderBy("created_at", "desc")),
  onData,
  onError
);

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

export const subscribeCarouselItems = (onData, onError) => subscribeToQuery(
  query(collection(db, "carousel"), orderBy("order", "asc")),
  onData,
  onError
);

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



export const updateOrderItemPower = async (itemId, updatedLensSelection) => {
  try {
    const itemRef = doc(db, "order_items", itemId);
    await updateDoc(itemRef, {
      lens_selection: updatedLensSelection,
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Sends a notification to a Telegram bot.
 * To get started:
 * 1. Create a bot via @BotFather on Telegram to get your BOT_TOKEN.
 * 2. Message @userinfobot to get your CHAT_ID.
 */
const sendTelegramNotification = async (message) => {
  const BOT_TOKEN = ""; // ADD YOUR BOT TOKEN HERE
  const CHAT_ID = "";    // ADD YOUR CHAT ID HERE
  
  if (!BOT_TOKEN || !CHAT_ID) return;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error("Telegram Notification Error:", error);
  }
};
