// api/send-order-push.js — Vercel Serverless Function
// Sends OS Lock Screen Push Notifications directly to all registered Admin devices
// via standard Web Push (VAPID). Wakes up the phone even if browser is closed.

import webpush from 'web-push';
import { db } from './utils/auth.js';

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BHrt5Obw1fsSEK4CF21_gTSBUWQt10jJsnG9GLbTNqsz3sOlBNIIao19bR70mkyXb4b0Rie4q2udAEFrqB_Wa6I';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'k-WrVnJNDGlJeI8vtHHl5IwrMa1dGFFyfbfQtqyd-bU';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@chashmalay.in';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { orderId, total, customerName, productName, image, subscriptions } = request.body || {};

  if (!orderId) {
    return response.status(400).json({ error: 'orderId is required' });
  }

  const orderIdShort = String(orderId).slice(0, 8).toUpperCase();
  const amount = Number(total || 0).toLocaleString();
  const customer = customerName || 'Customer';
  const item = productName || 'Eyewear';

  const payload = JSON.stringify({
    title: `🚨 New Order #${orderIdShort} (₹${amount})`,
    body: `${customer} placed an order for ${item}. Tap to review!`,
    icon: '/assets/im/logo.webp',
    badge: '/assets/im/logo.webp',
    image: image || undefined,
    url: '/admin/orders',
    tag: `order-${orderId}`,
    vibrate: [400, 200, 400, 200, 600]
  });

  let targetSubscriptions = [];

  // 1. If subscriptions were explicitly provided in the request
  if (Array.isArray(subscriptions) && subscriptions.length > 0) {
    targetSubscriptions = subscriptions;
  } else if (db) {
    // 2. Otherwise load from Firestore admin_push_subscriptions collection
    try {
      const snap = await db.collection('admin_push_subscriptions').get();
      snap.forEach(doc => {
        const data = doc.data();
        if (data.endpoint && data.keys) {
          targetSubscriptions.push({
            id: doc.id,
            subscription: {
              endpoint: data.endpoint,
              keys: data.keys
            }
          });
        }
      });
    } catch (dbErr) {
      console.warn('Could not read admin_push_subscriptions from DB:', dbErr.message);
    }
  }

  if (targetSubscriptions.length === 0) {
    return response.status(200).json({
      success: true,
      sentCount: 0,
      notice: 'No active admin push subscriptions registered yet'
    });
  }

  // Send push notification to every registered device in parallel
  const sendPromises = targetSubscriptions.map(async (item) => {
    const sub = item.subscription || item;
    try {
      await webpush.sendNotification(sub, payload);
      return { success: true };
    } catch (err) {
      console.warn('Web push delivery failed:', err.statusCode, err.message);
      // Clean up stale / revoked subscriptions (HTTP 404 or 410 Gone)
      if (db && item.id && (err.statusCode === 404 || err.statusCode === 410)) {
        await db.collection('admin_push_subscriptions').doc(item.id).delete().catch(() => {});
      }
      return { success: false, error: err.message };
    }
  });

  const results = await Promise.allSettled(sendPromises);
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;

  return response.status(200).json({
    success: true,
    sentCount: successCount,
    totalTargeted: targetSubscriptions.length
  });
}

