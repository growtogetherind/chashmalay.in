import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, orderBy, serverTimestamp, increment, runTransaction, onSnapshot } from "firebase/firestore";

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

export const writeAdminLog = async (action, targetId, metadata = {}) => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const profileSnap = await getDoc(doc(db, "profiles", user.uid));
    if (profileSnap.exists() && profileSnap.data().is_admin === true) {
      await addDoc(collection(db, "admin_logs"), {
        adminUid: user.uid,
        adminName: profileSnap.data().full_name || 'Admin',
        action,
        targetId,
        metadata,
        timestamp: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Failed to write admin log:", error);
  }
};

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
const bySortOrderThenName = (a, b) => {
  const sortA = Number(a.sort_order ?? 999);
  const sortB = Number(b.sort_order ?? 999);
  if (sortA !== sortB) return sortA - sortB;
  return byNameAsc(a, b);
};

// PUBLIC storefront settings — stored in `settings/global`, which is
// world-readable. NEVER put secrets (API keys, bot tokens) in this object or
// document; anyone can read it anonymously from Firestore.
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

// The set of keys that are SECRET and must live in the admin-only
// `settings/private` document, never in `settings/global`.
const PRIVATE_SETTING_KEYS = [
  'telegram_bot_token',
  'telegram_chat_id',
  'fast2sms_api_key',
  'fast2sms_sender_id'
];

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
  const payload = { ...normalized };
  delete payload.id;
  delete payload.gallery;
  delete payload.frameImage;
  delete payload.originalPrice;
  delete payload.consumersPrice;
  return payload;
};

const subscribeToQuery = (q, onData, onError, mapper = mapDoc) => onSnapshot(
  q,
  (snapshot) => onData(snapshot.docs.map((d) => mapper(d))),
  (error) => {
    if (import.meta.env.DEV) console.error("Firestore subscription error:", error);
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
    if (import.meta.env.DEV) console.error("Firebase getProducts error:", error);
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

export const getProductById = async (id, { includeReviews = true } = {}) => {
  try {
    const docSnap = await getDoc(doc(db, "products", id));
    if (docSnap.exists()) {
      let reviews = [];
      if (includeReviews) {
        const reviewsQ = query(collection(db, "reviews"), where("product_id", "==", id));
        const reviewsSnap = await getDocs(reviewsQ);
        reviews = reviewsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((review) => review.status === 'approved');
      }
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
      await writeAdminLog('edit_product', id, { name: payload.name });
    } else {
      const docRef = await addDoc(collection(db, "products"), {
        ...payload,
        created_at: serverTimestamp(),
        sku: payload.sku || `SKU-${Date.now()}`,
        status: payload.status || 'active'
      });
      await writeAdminLog('create_product', docRef.id, { name: payload.name });
    }
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, "products", id));
    await writeAdminLog('delete_product', id);
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

export const upsertCartItem = async (userId, productId, quantity, lensSelection = null, cartVariantKey = null) => {
  try {
    const id = cartVariantKey?.startsWith(`${userId}_`) ? cartVariantKey : `${userId}_${cartVariantKey || productId}`;
    await setDoc(doc(db, "cart_items", id), {
      user_id: userId,
      product_id: productId,
      quantity,
      lens_selection: lensSelection,
      cart_variant_key: id,
      updated_at: serverTimestamp()
    }, { merge: true });
    return { error: null };
  } catch (error) { return { error }; }
};

export const removeCartItem = async (userId, productId) => {
  try {
    const id = productId?.startsWith(`${userId}_`) ? productId : `${userId}_${productId}`;
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
export const createOrder = async ({ userId, items, total, address, paymentId, razorpayOrderId }) => {
  if (!checkRateLimit(`createOrder_${userId}`, 10000)) {
    throw new Error("Please wait before placing another order.");
  }
  const orderData = {
    user_id: userId,
    total_amount: total,
    shipping_address: address,
    razorpay_payment_id: paymentId,
    razorpay_order_id: razorpayOrderId || null,
    status: 'confirmed',
    created_at: serverTimestamp()
  };
  const orderRef = await addDoc(collection(db, "orders"), orderData);

  // Send Fast2SMS Order Confirmation
  sendOrderConfirmationSMS(
    address.phone,
    address.name,
    orderRef.id.slice(0, 8).toUpperCase(),
    total
  );

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
    if (item.lensSelection?.selectedLens?.price) lensTotal += Number(item.lensSelection.selectedLens.price);
    if (item.lensSelection?.addons?.length) {
      item.lensSelection.addons.forEach(a => { lensTotal += Number(a.price || 0); });
    }
    const finalItemPrice = basePrice + lensTotal;

    // Check for prescriptions and save them to 'prescriptions' collection
    const lens = item.lensSelection;
    if (lens && (lens.prescriptionUrl || lens.manualDetails || lens.powerOption === 'later')) {
      try {
        // Strip any Cloudinary display-transform params so stored URL is always a clean direct link
        const cleanRxUrl = cleanCloudinaryUrl(lens.prescriptionUrl);
        await savePrescription({
          user_id: userId,
          user_name: address.name || 'Customer',
          user_phone: address.phone || '',
          order_id: orderRef.id,
          product_name: item.name || 'Premium Eyewear',
          image_url: cleanRxUrl || null,
          right_eye: lens.manualDetails ? {
            sph: lens.manualDetails.rightSph || '',
            cyl: lens.manualDetails.rightCyl || '',
            axis: lens.manualDetails.rightAxis || '',
            add: lens.manualDetails.rightAddlPower || ''
          } : null,
          left_eye: lens.manualDetails ? {
            sph: lens.manualDetails.leftSph || '',
            cyl: lens.manualDetails.leftCyl || '',
            axis: lens.manualDetails.leftAxis || '',
            add: lens.manualDetails.leftAddlPower || ''
          } : null,
          status: 'pending'
        });

        // If a file was uploaded, trigger a dedicated Telegram notification
        if (cleanRxUrl) {
          sendTelegramNotification(`📑 *New Prescription Uploaded!*\n\n*Customer:* ${address.name}\n*Phone:* ${address.phone}\n*Order ID:* #${orderRef.id.slice(0, 8).toUpperCase()}\n*Item:* ${item.name || 'Eyewear'}\n\n🖼️ [View Uploaded Prescription](${cleanRxUrl})`);
        }
      } catch (e) {
        console.error("Error saving prescription to database:", e);
      }
    }

    return addDoc(collection(db, "order_items"), {
      order_id: orderRef.id,
      product_id: pid || `custom-${Date.now()}`,
      quantity: qty,
      price: finalItemPrice,
      product_name: item.name || 'Premium Eyewear',
      frame_image: getProductImage(item),
      category: item.category || '',
      brand: item.brand || '',
      lens_selection: item.lensSelection || null,
      selected_color: item.lensSelection?.selectedColor || null,
      selected_size: item.lensSelection?.selectedSize || null,
      cart_variant_key: item.cartVariantKey || item.firebaseId || null
    });
  });
  await Promise.all(batchPromises);

  // Generate detailed notification body for Telegram
  let itemsDetail = '';
  items.forEach((item, index) => {
    const qty = item.quantity || 1;
    const basePrice = parseInt((item.price || item.consumersPrice || "0").toString().replace(/,/g, ''));
    let lensTotal = 0;
    if (item.lensSelection?.selectedLens?.price) lensTotal += Number(item.lensSelection.selectedLens.price);
    if (item.lensSelection?.addons?.length) {
      item.lensSelection.addons.forEach(a => { lensTotal += Number(a.price || 0); });
    }
    const finalItemPrice = basePrice + lensTotal;
    
    const color = item.lensSelection?.selectedColor 
      ? (typeof item.lensSelection.selectedColor === 'string' ? item.lensSelection.selectedColor : item.lensSelection.selectedColor.name)
      : 'Standard';
    const size = item.lensSelection?.selectedSize || 'Standard';

    itemsDetail += `\n*${index + 1}. ${item.name}*\n`;
    itemsDetail += `   • *Brand:* ${item.brand || 'Premium Edition'}\n`;
    itemsDetail += `   • *Specs:* Color: ${color} | Size: ${size}\n`;
    itemsDetail += `   • *Qty:* ${qty} x ₹${finalItemPrice.toLocaleString()} = ₹${(finalItemPrice * qty).toLocaleString()}\n`;
    
    if (item.lensSelection && item.lensSelection.visionType?.id !== 'frame') {
      const ls = item.lensSelection;
      if (ls.selectedLens) {
        itemsDetail += `   • *Lens:* ${ls.selectedLens.name} — ${ls.visionType?.name || ls.category || 'N/A'} (₹${ls.selectedLens.price || 0})\n`;
      }
      if (ls.addons?.length) {
        itemsDetail += `   • *Add-ons:* ${ls.addons.map(a => `${a.name} (₹${a.price})`).join(', ')}\n`;
      }
      if (ls.prescriptionUrl) {
        itemsDetail += `   • *Prescription:* [View Uploaded Image](${cleanCloudinaryUrl(ls.prescriptionUrl)})\n`;
      } else if (ls.manualDetails) {
        const md = ls.manualDetails;
        itemsDetail += `   • *Prescription (Manual Power):*\n`;
        itemsDetail += `     OD (Right): SPH: ${md.rightSph || '-'} | CYL: ${md.rightCyl || '-'} | AXIS: ${md.rightAxis || '-'} | ADD: ${md.rightAddlPower || '-'}\n`;
        itemsDetail += `     OS (Left):  SPH: ${md.leftSph || '-'} | CYL: ${md.leftCyl || '-'} | AXIS: ${md.leftAxis || '-'} | ADD: ${md.leftAddlPower || '-'}\n`;
      } else {
        itemsDetail += `   • *Prescription:* Upload Later (Follow-up via WhatsApp)\n`;
      }
    }
  });

  const fullOrderDescription = `🛒 *New Customer Order Placed!*

*Order ID:* #${orderRef.id.slice(0, 8).toUpperCase()} (Full: \`${orderRef.id}\`)
*Razorpay Payment ID:* \`${paymentId || 'N/A'}\`
*Amount:* ₹${Number(total).toLocaleString()}
*Status:* Confirmed

*Customer Details:*
• *Name:* ${address.name}
• *Phone:* ${address.phone}
• *DOB:* ${address.dob || 'Not Provided'}

*Delivery Address:*
${address.line1}${address.line2 ? `, ${address.line2}` : ''}
${address.city}, ${address.state} - ${address.pincode}

*Order Items:*${itemsDetail}

_Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`;

  // Send Telegram Notification
  sendTelegramNotification(fullOrderDescription);

  return { id: orderRef.id, ...orderData };
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
    await writeAdminLog('update_order_status', orderId, { status, previousStatus });

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
    data.sort(bySortOrderThenName);
    return { data, error: null };
  } catch (error) {
    console.error("getCategories Error:", error);
    return { data: [], error };
  }
};

export const subscribeCategories = (onData, onError) => subscribeToQuery(
  collection(db, "categories"),
  (items) => onData(items.sort(bySortOrderThenName)),
  onError
);

const slugify = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const categoryPayload = (category = {}) => {
  const image = category.image_url || category.image || category.base_photo || category.basePhoto || category.photo || '';
  return {
    ...category,
    name: category.name?.trim() || '',
    slug: category.slug || slugify(category.name),
    image,
    image_url: image,
    description: category.description || '',
    color: category.color || '#f8fafc',
    accent: category.accent || '#1d4ed8',
    sort_order: Number(category.sort_order || 999),
    is_active: category.is_active !== false,
  };
};

export const saveCategory = async (category, id = null) => {
  try {
    const payload = categoryPayload(category);
    if (id) await updateDoc(doc(db, "categories", id), { ...payload, updated_at: serverTimestamp() });
    else await addDoc(collection(db, "categories"), { ...payload, created_at: serverTimestamp(), updated_at: serverTimestamp() });
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
    if (id) {
      await updateDoc(doc(db, "prescriptions", id), { ...data, updated_at: serverTimestamp() });
      await writeAdminLog('verify_prescription', id, { status: data.status });
    } else {
      await addDoc(collection(db, "prescriptions"), { ...data, created_at: serverTimestamp() });
    }
    return { error: null };
  } catch (error) { return { error }; }
};

// --- Settings ---
// Public settings live in `settings/global` (world-readable). Secrets live in
// `settings/private` (admin-only per Firestore rules). Keep them separate.
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

// Admin-only: read the private secrets document. Returns {} for non-admins
// (Firestore denies the read) so callers can safely spread the result.
export const getPrivateSettings = async () => {
  try {
    const docSnap = await getDoc(doc(db, "settings", "private"));
    return { data: docSnap.exists() ? docSnap.data() : {}, error: null };
  } catch (error) { return { data: {}, error }; }
};

// Persist settings, routing each key to the correct document. Public keys go to
// `settings/global`; the enumerated secret keys go to `settings/private`. This
// guarantees a secret can never be accidentally written to the public doc.
export const saveSettings = async (settings = {}) => {
  try {
    const publicData = {};
    const privateData = {};
    for (const [key, value] of Object.entries(settings)) {
      if (key === 'updated_at') continue;
      if (PRIVATE_SETTING_KEYS.includes(key)) privateData[key] = value;
      else publicData[key] = value;
    }

    const writes = [
      setDoc(doc(db, "settings", "global"), { ...publicData, updated_at: serverTimestamp() }, { merge: true })
    ];
    if (Object.keys(privateData).length > 0) {
      writes.push(
        setDoc(doc(db, "settings", "private"), { ...privateData, updated_at: serverTimestamp() }, { merge: true })
      );
    }
    await Promise.all(writes);
    await writeAdminLog('save_settings', 'global_private', { 
      updatedKeys: Object.keys(settings).filter(k => k !== 'updated_at') 
    });
    return { error: null };
  } catch (error) { return { error }; }
};

export const toggleUserBlock = async (userId, isBlocked) => {
  try {
    await updateDoc(doc(db, "profiles", userId), {
      is_blocked: isBlocked,
      updated_at: serverTimestamp()
    });
    await writeAdminLog(isBlocked ? 'block_user' : 'unblock_user', userId);
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
const buildReviewSummary = (reviews = []) => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating || 0))));
    counts[rating] += 1;
  });

  const count = reviews.length;
  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  const average = count ? Number((total / count).toFixed(1)) : 0;

  return { average, count, counts };
};

export const recomputeProductReviewSummary = async (productId) => {
  if (!productId) return { error: null };

  try {
    const reviewsQ = query(collection(db, "reviews"), where("product_id", "==", productId));
    const reviewsSnap = await getDocs(reviewsQ);
    const approvedReviews = reviewsSnap.docs
      .map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() }))
      .filter((review) => review.status === 'approved');
    const summary = buildReviewSummary(approvedReviews);

    await updateDoc(doc(db, "products", productId), {
      review_summary: summary,
      rating: summary.average,
      review_count: summary.count,
      updated_at: serverTimestamp()
    });

    return { data: summary, error: null };
  } catch (error) {
    console.error("Firebase recomputeProductReviewSummary error:", error);
    return { data: null, error };
  }
};

export const addReview = async (productId, userId, rating, comment, userInfo) => {
  if (!checkRateLimit(`addReview_${userId}_${productId}`, 15000)) {
    return { error: "You are submitting reviews too quickly. Please wait." };
  }
  try {
    const reviewData = {
      product_id: productId,
      user_id: userId,
      rating: Number(rating),
      comment: comment.trim(),
      // FIX: Only store display name — never email in a publicly readable collection
      reviewer_name: userInfo?.full_name || 'Anonymous Customer',
      product_name: userInfo?.product_name || '',
      status: 'pending',
      helpful_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
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
    where("status", "==", "approved")
  ),
  (reviews) => onData(reviews.sort(byCreatedDesc)),
  onError
);

export const updateReviewStatus = async (id, status) => {
  try {
    const reviewRef = doc(db, "reviews", id);
    const reviewSnap = await getDoc(reviewRef);
    const productId = reviewSnap.exists() ? reviewSnap.data().product_id : null;

    await updateDoc(reviewRef, { status, updated_at: serverTimestamp() });
    await recomputeProductReviewSummary(productId);
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const deleteReview = async (id) => {
  try {
    const reviewRef = doc(db, "reviews", id);
    const reviewSnap = await getDoc(reviewRef);
    const productId = reviewSnap.exists() ? reviewSnap.data().product_id : null;

    await deleteDoc(reviewRef);
    await recomputeProductReviewSummary(productId);
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
 * Strips Cloudinary display-transform parameters from a URL.
 * e.g. converts  .../upload/f_auto,q_auto,c_scale,w_800/v1/.../image.webp
 *      back to   .../upload/v1/.../image.webp
 * This ensures URLs stored in Firestore and sent as Telegram links are clean and clickable.
 */
const cleanCloudinaryUrl = (url) => {
  if (!url || !url.includes('/upload/')) return url || '';
  // Remove any transformation segment between /upload/ and the version or file path
  return url.replace(/\/upload\/[^/]+(?=\/v\d|\/[a-z0-9_-]+\/)/, '/upload');
};

// Sends an admin notification via Telegram. The bot token/chat id are SECRET
// and never touch the browser — the request is proxied through the same-origin
// serverless endpoint `/api/notify-telegram`, which reads them from server env.
export const sendTelegramNotification = async (message, options = {}) => {
  if (!message) return;
  try {
    const payload = { message };
    if (options.reply_markup) payload.reply_markup = options.reply_markup;

    if (!auth.currentUser) {
      const { signInAnonymously } = await import("firebase/auth");
      await signInAnonymously(auth);
    }
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    await fetch("/api/notify-telegram", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
  } catch (error) {
    // Notifications are best-effort — never let a failed alert break the flow.
    if (import.meta.env.DEV) console.error("Telegram Notification Error:", error);
  }
};

// Sends the order-confirmation SMS via the same-origin serverless proxy
// `/api/send-sms`, which holds the Fast2SMS key server-side. There is NO
// client-side fallback — that would require shipping the API key to the browser.
export const sendOrderConfirmationSMS = async (phoneNumber, customerName, orderId, amount) => {
  if (!phoneNumber) return;
  try {
    if (!auth.currentUser) {
      const { signInAnonymously } = await import("firebase/auth");
      await signInAnonymously(auth);
    }
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("/api/send-sms", {
      method: "POST",
      headers,
      body: JSON.stringify({ phoneNumber, customerName, orderId, amount })
    });

    if (response.ok) {
      if (import.meta.env.DEV) {
        const data = await response.json().catch(() => ({}));
        console.log("SMS sent successfully via backend proxy:", data);
      }
    } else if (import.meta.env.DEV) {
      console.warn("SMS backend proxy returned non-OK status:", response.status);
    }
  } catch (error) {
    // Best-effort — a failed SMS must not interrupt order completion.
    if (import.meta.env.DEV) console.error("SMS Notification Error:", error);
  }
};

// ─── Lens System (Categories, Lenses, Add-ons) ───────────────────────────────

// --- Lens Categories ---
export const getLensCategories = async () => {
  try {
    const q = query(collection(db, "lens_categories"), orderBy("sort_order", "asc"));
    const snap = await getDocs(q);
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) { return { data: [], error }; }
};

export const subscribeLensCategories = (onData, onError) => subscribeToQuery(
  query(collection(db, "lens_categories"), orderBy("sort_order", "asc")),
  onData,
  onError
);

export const saveLensCategory = async (data, id = null) => {
  try {
    const payload = { ...data, sort_order: Number(data.sort_order || 999), updated_at: serverTimestamp() };
    if (id) await updateDoc(doc(db, "lens_categories", id), payload);
    else await addDoc(collection(db, "lens_categories"), { ...payload, created_at: serverTimestamp() });
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteLensCategory = async (id) => {
  try {
    await deleteDoc(doc(db, "lens_categories", id));
    return { error: null };
  } catch (error) { return { error }; }
};

// --- Lenses ---
export const getLenses = async (categoryId = null) => {
  try {
    let q = query(collection(db, "lenses"), orderBy("sort_order", "asc"));
    if (categoryId) q = query(collection(db, "lenses"), where("category_id", "==", categoryId), orderBy("sort_order", "asc"));
    const snap = await getDocs(q);
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) { return { data: [], error }; }
};

export const subscribeLenses = (onData, onError) => subscribeToQuery(
  query(collection(db, "lenses"), orderBy("sort_order", "asc")),
  onData,
  onError
);

export const saveLens = async (data, id = null) => {
  try {
    const payload = { ...data, price: Number(data.price || 0), sort_order: Number(data.sort_order || 999), updated_at: serverTimestamp() };
    if (id) await updateDoc(doc(db, "lenses", id), payload);
    else await addDoc(collection(db, "lenses"), { ...payload, created_at: serverTimestamp() });
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteLens = async (id) => {
  try {
    await deleteDoc(doc(db, "lenses", id));
    return { error: null };
  } catch (error) { return { error }; }
};

// --- Lens Add-ons ---
export const getLensAddons = async () => {
  try {
    const q = query(collection(db, "lens_addons"), orderBy("sort_order", "asc"));
    const snap = await getDocs(q);
    return { data: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) { return { data: [], error }; }
};

export const subscribeLensAddons = (onData, onError) => subscribeToQuery(
  query(collection(db, "lens_addons"), orderBy("sort_order", "asc")),
  onData,
  onError
);

export const saveLensAddon = async (data, id = null) => {
  try {
    const payload = { ...data, price: Number(data.price || 0), sort_order: Number(data.sort_order || 999), updated_at: serverTimestamp() };
    if (id) await updateDoc(doc(db, "lens_addons", id), payload);
    else await addDoc(collection(db, "lens_addons"), { ...payload, created_at: serverTimestamp() });
    return { error: null };
  } catch (error) { return { error }; }
};

export const deleteLensAddon = async (id) => {
  try {
    await deleteDoc(doc(db, "lens_addons", id));
    return { error: null };
  } catch (error) { return { error }; }
};

// --- Lens System Seeder ---
// Seeds default data into empty collections so the admin dashboard starts functional.
export const seedLensSystemIfEmpty = async () => {
  try {
    const [catSnap, lensSnap, addonSnap] = await Promise.all([
      getDocs(collection(db, "lens_categories")),
      getDocs(collection(db, "lenses")),
      getDocs(collection(db, "lens_addons")),
    ]);
    const now = serverTimestamp();

    // --- Seed Lens Categories ---
    let categoryIds = {};
    if (catSnap.empty) {
      const defaultCats = [
        { name: 'Single Vision', slug: 'single-vision', description: 'Corrects one field of vision (Distance or Reading).', sort_order: 1, is_active: true },
        { name: 'Bifocal', slug: 'bifocal', description: 'Two optical powers in one lens for Distance and Reading.', sort_order: 2, is_active: true },
        { name: 'Progressive', slug: 'progressive', description: 'Seamless transition between Distance, Intermediate and Reading vision.', sort_order: 3, is_active: true },
      ];
      for (const cat of defaultCats) {
        const ref = await addDoc(collection(db, "lens_categories"), { ...cat, created_at: now, updated_at: now });
        categoryIds[cat.slug] = ref.id;
      }
    } else {
      catSnap.docs.forEach(d => { categoryIds[d.data().slug] = d.id; });
    }

    // --- Seed Lenses ---
    if (lensSnap.empty) {
      const defaultLenses = [
        // --- Single Vision Lenses ---
        {
          name: 'Anti Glare Premium (Echo HMC)',
          category_id: categoryIds['single-vision'] || '',
          category_name: 'Single Vision',
          price: 490,
          description: 'Affordable anti-glare lens for everyday use.',
          features: ['Anti Glare Coating', 'Scratch Resistant', 'Better Clarity', 'Daily Use', 'Lightweight'],
          badge: 'Budget',
          sort_order: 1,
          is_active: true
        },
        {
          name: 'Blue Protection (Nature UV)',
          category_id: categoryIds['single-vision'] || '',
          category_name: 'Single Vision',
          price: 749,
          description: 'Protects eyes from blue light emitted by digital screens.',
          features: ['Blue Light Protection', 'UV Protection', 'Scratch Resistant', 'Clear Vision', 'Suitable for Office Use'],
          badge: 'Popular',
          sort_order: 2,
          is_active: true
        },
        {
          name: 'Low Reflection Blue Screen',
          category_id: categoryIds['single-vision'] || '',
          category_name: 'Single Vision',
          price: 1349,
          description: 'Premium blue-cut lens with low reflection coating.',
          features: ['Premium Blue Filter', 'Low Reflection', 'UV Protection', 'Anti Glare', 'Scratch Resistant', 'High Clarity'],
          badge: 'Top Selling',
          sort_order: 3,
          is_active: true
        },
        {
          name: 'Night Driving + Blue Protection',
          category_id: categoryIds['single-vision'] || '',
          category_name: 'Single Vision',
          price: 1499,
          description: 'Special coating for reduced glare while driving at night.',
          features: ['Night Driving Technology', 'Blue Protection', 'Anti Glare', 'Better Contrast', 'Scratch Resistant'],
          badge: 'Recommended',
          sort_order: 4,
          is_active: true
        },

        // --- Bifocal Lenses ---
        {
          name: 'Round Top Bifocal',
          category_id: categoryIds['bifocal'] || '',
          category_name: 'Bifocal',
          price: 699,
          description: 'Traditional bifocal lens.',
          features: ['UV Protection', 'Free Anti Reflection', 'Reading Segment', 'Scratch Resistant'],
          badge: 'Budget',
          sort_order: 1,
          is_active: true
        },
        {
          name: 'Anti Glare Round Top (Echo HMC)',
          category_id: categoryIds['bifocal'] || '',
          category_name: 'Bifocal',
          price: 1249,
          description: 'Round-top bifocal with anti-glare coating.',
          features: ['Anti Glare', 'Scratch Resistant', 'Better Clarity', 'UV Protection'],
          badge: 'Popular',
          sort_order: 2,
          is_active: true
        },
        {
          name: 'Blue Protection (Nature UV)',
          category_id: categoryIds['bifocal'] || '',
          category_name: 'Bifocal',
          price: 1799,
          description: 'Blue light protection bifocal lens.',
          features: ['Blue Light Protection', 'UV Protection', 'Anti Glare', 'Scratch Resistant', 'Premium Finish'],
          badge: 'Top Selling',
          sort_order: 3,
          is_active: true
        },
        {
          name: 'Blue Screen Protect Lens',
          category_id: categoryIds['bifocal'] || '',
          category_name: 'Bifocal',
          price: 2490,
          description: 'Premium bifocal lens for heavy screen users.',
          features: ['Advanced Blue Filter', 'UV Protection', 'Premium Anti Reflection', 'Better Eye Comfort', 'Scratch Resistant'],
          badge: 'Recommended',
          sort_order: 4,
          is_active: true
        },

        // --- Progressive Lenses ---
        {
          name: 'Anti Glare Premium (Echo HMC)',
          category_id: categoryIds['progressive'] || '',
          category_name: 'Progressive',
          price: 1190,
          description: 'Entry-level progressive lens.',
          features: ['Anti Glare', 'Scratch Resistant', 'Smooth Transition', 'Daily Use'],
          badge: 'Budget',
          sort_order: 1,
          is_active: true
        },
        {
          name: 'Blue Protection (Nature UV)',
          category_id: categoryIds['progressive'] || '',
          category_name: 'Progressive',
          price: 1549,
          description: 'Progressive lens with blue light protection.',
          features: ['Blue Protection', 'UV Protection', 'Anti Glare', 'Scratch Resistant'],
          badge: 'Popular',
          sort_order: 2,
          is_active: true
        },
        {
          name: 'Low Reflection Blue Screen',
          category_id: categoryIds['progressive'] || '',
          category_name: 'Progressive',
          price: 2490,
          description: 'Premium progressive lens with low reflection coating.',
          features: ['Premium Blue Filter', 'Low Reflection', 'Anti Glare', 'UV Protection', 'Scratch Resistant'],
          badge: 'Top Selling',
          sort_order: 3,
          is_active: true
        },
        {
          name: 'Wide Corridor Blue Protection',
          category_id: categoryIds['progressive'] || '',
          category_name: 'Progressive',
          price: 2490,
          description: 'Wide viewing area with blue light protection.',
          features: ['Wide Corridor Design', 'Blue Protection', 'Smooth Transition', 'Comfortable Vision'],
          badge: 'Recommended',
          sort_order: 4,
          is_active: true
        },
        {
          name: 'Wide Corridor + Low Reflection Blue Screen',
          category_id: categoryIds['progressive'] || '',
          category_name: 'Progressive',
          price: 3490,
          description: 'Wide corridor premium lens with blue filter.',
          features: ['Wide Corridor', 'Premium Blue Filter', 'Low Reflection', 'Anti Glare', 'UV Protection'],
          badge: 'Best Value',
          sort_order: 5,
          is_active: true
        },
        {
          name: 'Wide Corridor Night Driving + Blue Protection',
          category_id: categoryIds['progressive'] || '',
          category_name: 'Progressive',
          price: 3890,
          description: 'Ultimate progressive lens for professionals and frequent drivers.',
          features: ['Night Driving Technology', 'Wide Corridor', 'Blue Protection', 'Premium Anti Reflection', 'UV Protection', 'Scratch Resistant'],
          badge: 'Premium',
          sort_order: 6,
          is_active: true
        }
      ];
      for (const lens of defaultLenses) {
        await addDoc(collection(db, "lenses"), { ...lens, created_at: now, updated_at: now });
      }
    }

    // --- Seed Add-ons ---
    if (addonSnap.empty) {
      const defaultAddons = [
        // --- Group: Lens Treatment ---
        {
          name: 'Base Lens',
          group: 'Lens Treatment',
          price: 0,
          description: 'Standard clear lens included.',
          applicable_categories: ['single-vision', 'bifocal', 'progressive'],
          sort_order: 1,
          is_active: true,
          is_default: true
        },
        {
          name: 'Photochromic Grey',
          group: 'Lens Treatment',
          price: 500,
          description: 'Automatically darkens outdoors and becomes clear indoors.',
          applicable_categories: ['single-vision', 'bifocal', 'progressive'],
          sort_order: 2,
          is_active: true,
          is_default: false
        },
        {
          name: 'Photochromic Brown',
          group: 'Lens Treatment',
          price: 500,
          description: 'Brown transition tint for better outdoor contrast.',
          applicable_categories: ['single-vision', 'bifocal', 'progressive'],
          sort_order: 3,
          is_active: true,
          is_default: false
        },

        // --- Group: Premium Coating ---
        {
          name: 'Super Hydrophobic Coating',
          group: 'Premium Coating',
          price: 350,
          description: 'Repels water, oil, fingerprints and dust.',
          applicable_categories: ['single-vision', 'bifocal', 'progressive'],
          sort_order: 4,
          is_active: true,
          is_default: false
        },

        // --- Group: Scratch Protection ---
        {
          name: 'Premium Scratch Resistant',
          group: 'Scratch Protection',
          price: 250,
          description: 'Extra scratch-resistant coating for longer lens life.',
          applicable_categories: ['single-vision', 'bifocal', 'progressive'],
          sort_order: 5,
          is_active: true,
          is_default: false
        },

        // --- Group: UV Protection ---
        {
          name: 'UV400 Protection',
          group: 'UV Protection',
          price: 300,
          description: 'Blocks 100% UVA & UVB rays.',
          applicable_categories: ['single-vision', 'bifocal', 'progressive'],
          sort_order: 6,
          is_active: true,
          is_default: false
        },

        // --- Group: Driving ---
        {
          name: 'Night Driving Upgrade',
          group: 'Driving',
          price: 450,
          description: 'Reduces glare from headlights and improves night vision.',
          applicable_categories: ['single-vision', 'progressive'],
          sort_order: 7,
          is_active: true,
          is_default: false
        },

        // --- Group: Polarized ---
        {
          name: 'Polarized Upgrade',
          group: 'Polarized',
          price: 700,
          description: 'Reduces reflections from roads, water, and glass surfaces.',
          applicable_categories: ['single-vision', 'progressive'],
          sort_order: 8,
          is_active: true,
          is_default: false
        },

        // --- Group: Premium Package ---
        {
          name: 'Diamond Coating',
          group: 'Premium Package',
          price: 900,
          description: 'Premium coating combining: Anti Glare, Hydrophobic Layer, Oleophobic Layer, UV Protection, Enhanced Scratch Resistance',
          applicable_categories: ['single-vision', 'bifocal', 'progressive'],
          sort_order: 9,
          is_active: true,
          is_default: false
        }
      ];
      for (const addon of defaultAddons) {
        await addDoc(collection(db, "lens_addons"), { ...addon, created_at: now, updated_at: now });
      }
    }
    return { error: null };
  } catch (error) { return { error }; }
};
