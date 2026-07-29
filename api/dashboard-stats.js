// api/dashboard-stats.js — Vercel Serverless Function
// Computes store analytics efficiently on the server. Admin-only.

import { verifyAdmin, db } from './utils/auth.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Verify admin privilege
    await verifyAdmin(request);
  } catch (authError) {
    return response.status(authError.statusCode || 401).json({ error: authError.message });
  }

  try {
    // 2. Run parallel native server-side counts (extremely cheap & fast!)
    const [
      ordersCountRes,
      profilesCountRes,
      productsCountRes,
      lowStockCountRes,
      pendingOrdersCountRes
    ] = await Promise.all([
      db.collection('orders').count().get(),
      db.collection('profiles').count().get(),
      db.collection('products').count().get(),
      db.collection('products').where('stock_quantity', '<=', 10).count().get(),
      db.collection('orders').where('status', 'in', ['pending', 'confirmed']).count().get()
    ]);

    // 3. Fetch only the total_amount fields to compute revenue without downloading large objects
    const ordersSnap = await db.collection('orders').select('total_amount').get();
    let revenue = 0;
    ordersSnap.forEach(doc => {
      revenue += Number(doc.data().total_amount || 0);
    });

    return response.status(200).json({
      orderCount: ordersCountRes.data().count,
      profileCount: profilesCountRes.data().count,
      productCount: productsCountRes.data().count,
      lowStockProducts: lowStockCountRes.data().count,
      pendingOrders: pendingOrdersCountRes.data().count,
      revenue
    });
  } catch (error) {
    console.error('dashboard-stats internal error:', error);
    return response.status(500).json({ error: 'Internal server error.' });
  }
}
