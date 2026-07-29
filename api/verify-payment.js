// api/verify-payment.js — Vercel Serverless Function
// Verifies the Razorpay payment signature and confirms the order transactionally.

import { createHmac } from 'crypto';
import { verifyAuth } from './utils/auth.js';
import { confirmOrder } from './utils/orderHelper.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await verifyAuth(request);
  } catch (authError) {
    return response.status(authError.statusCode || 401).json({ error: authError.message });
  }

  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  if (!KEY_SECRET) {
    console.error('RAZORPAY_KEY_SECRET not set on server.');
    return response.status(500).json({ error: 'Payment gateway not configured on server.' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return response.status(400).json({
      error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
    });
  }

  try {
    // 1. Verify Razorpay signature authenticity
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHmac('sha256', KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('Razorpay signature mismatch. Possible tampered request.', {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return response.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
    }

    // 2. Perform transactional confirmation, stock update, and alerts on the backend
    const confirmResult = await confirmOrder(razorpay_order_id, razorpay_payment_id);
    if (!confirmResult.success) {
      return response.status(500).json({ error: confirmResult.error || 'Failed to complete order confirmation.' });
    }

    return response.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (error) {
    console.error('verify-payment internal error:', error);
    return response.status(500).json({ error: 'Internal server error.' });
  }
}
