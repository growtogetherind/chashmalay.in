// api/save-push-subscription.js — Vercel Serverless Function
// Securely registers or updates an Admin device push subscription

import { db, verifyAdmin } from './utils/auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await verifyAdmin(request);
  } catch (authErr) {
    return response.status(authErr.statusCode || 401).json({ error: authErr.message });
  }

  const { subscription, userAgent } = request.body || {};

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return response.status(400).json({ error: 'Valid push subscription object is required' });
  }

  if (!db) {
    return response.status(200).json({ success: true, savedLocally: true });
  }

  try {
    // Generate a deterministic ID based on endpoint hash to prevent duplicate entries
    const subId = Buffer.from(subscription.endpoint).toString('base64').replace(/[/+=]/g, '_').slice(-40);
    await db.collection('admin_push_subscriptions').doc(subId).set({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: userAgent || 'Unknown browser',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return response.status(200).json({ success: true, id: subId });
  } catch (err) {
    console.error('Error saving push subscription:', err);
    return response.status(500).json({ error: 'Failed to save subscription' });
  }
}

