import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Product Queries ─────────────────────────────────────────────────────────

export const getProducts = async ({ category, shape, priceMin, priceMax, sortBy = 'created_at' } = {}) => {
  let query = supabase.from('products').select('*').eq('is_active', true);
  if (category) query = query.eq('category', category);
  if (shape) query = query.eq('shape', shape);
  if (priceMin) query = query.gte('price', priceMin);
  if (priceMax) query = query.lte('price', priceMax);
  if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
  else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });
  return query;
};

export const getProductById = async (id) => {
  return supabase.from('products').select('*, reviews(*, profiles(full_name))').eq('id', id).single();
};

// ─── Cart Queries ─────────────────────────────────────────────────────────────

export const getCartItems = async (userId) => {
  return supabase.from('cart_items').select('*, products(*)').eq('user_id', userId);
};

export const upsertCartItem = async (userId, productId, quantity) => {
  return supabase.from('cart_items').upsert(
    { user_id: userId, product_id: productId, quantity },
    { onConflict: 'user_id,product_id' }
  );
};

export const removeCartItem = async (userId, productId) => {
  return supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId);
};

export const clearCart = async (userId) => {
  return supabase.from('cart_items').delete().eq('user_id', userId);
};

// ─── Order Queries ────────────────────────────────────────────────────────────

export const createOrder = async ({ userId, items, total, address, paymentId }) => {
  const { data: order, error } = await supabase.from('orders').insert({
    user_id: userId,
    total_amount: total,
    shipping_address: address,
    razorpay_payment_id: paymentId,
    status: 'confirmed'
  }).select().single();

  if (error) throw error;

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.products.price,
    product_name: item.products.name
  }));

  await supabase.from('order_items').insert(orderItems);
  return order;
};

export const getUserOrders = async (userId) => {
  return supabase.from('orders')
    .select('*, order_items(*, products(name, frame_image))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

export const getOrderById = async (orderId) => {
  return supabase.from('orders').select('*, order_items(*, products(*))').eq('id', orderId).single();
};

// ─── Profile Queries ──────────────────────────────────────────────────────────

export const getProfile = async (userId) => {
  return supabase.from('profiles').select('*').eq('id', userId).single();
};

export const updateProfile = async (userId, updates) => {
  return supabase.from('profiles').upsert({ id: userId, ...updates });
};

// ─── Review Queries ───────────────────────────────────────────────────────────

export const addReview = async ({ userId, productId, rating, comment }) => {
  return supabase.from('reviews').insert({ user_id: userId, product_id: productId, rating, comment });
};

// ─── Wishlist Queries ─────────────────────────────────────────────────────────

export const getWishlist = async (userId) => {
  return supabase.from('wishlists').select('*, products(*)').eq('user_id', userId);
};

export const toggleWishlist = async (userId, productId) => {
  const { data } = await supabase.from('wishlists').select('id').eq('user_id', userId).eq('product_id', productId).single();
  if (data) {
    return supabase.from('wishlists').delete().eq('id', data.id);
  }
  return supabase.from('wishlists').insert({ user_id: userId, product_id: productId });
};
