// api/verify-payment.js — Vercel Serverless Function
// Verifies the Razorpay payment signature using HMAC-SHA256.
// This MUST run server-side — the KEY_SECRET must never be sent to the browser.

import { createHmac } from 'crypto';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
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
    // Razorpay signature algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHmac('sha256', KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // IMPORTANT: Do NOT mark as paid if signatures don't match — this is a tampered request.
      console.warn('Razorpay signature mismatch. Possible tampered request.', {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return response.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
    }

    // Signatures match — payment is authentic
    return response.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (error) {
    console.error('verify-payment internal error:', error);
    return response.status(500).json({ error: 'Internal server error.', details: error.message });
  }
}
