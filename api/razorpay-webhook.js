// api/razorpay-webhook.js — Vercel Serverless Function
// Listens to Razorpay payment.captured webhook to confirm orders in the background.

import { createHmac } from 'crypto';
import { confirmOrder } from './utils/orderHelper.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const signature = request.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  if (isProduction && !webhookSecret) {
    console.error('Critical Error: RAZORPAY_WEBHOOK_SECRET is not configured in production.');
    return response.status(500).json({ error: 'Webhook verification unavailable.' });
  }

  // 1. Verify webhook signature if secret is configured
  if (webhookSecret) {
    if (!signature) {
      console.warn('Razorpay webhook request missing signature header.');
      return response.status(400).json({ error: 'Missing signature header' });
    }
    const rawBody = JSON.stringify(request.body);
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Razorpay webhook signature mismatch.');
      return response.status(400).json({ error: 'Invalid signature' });
    }
  } else {
    console.warn('RAZORPAY_WEBHOOK_SECRET is not configured. Webhook signature check skipped.');
  }

  const event = request.body.event;
  if (event === 'payment.captured') {
    try {
      const paymentEntity = request.body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      if (!razorpayOrderId) {
        console.warn('Webhook received payment.captured but order_id is missing.');
        return response.status(200).json({ status: 'ignored', message: 'No order_id' });
      }

      console.log(`Processing Webhook confirmOrder: Order ${razorpayOrderId}, Payment ${razorpayPaymentId}`);
      
      // Confirm the order transactionally
      const result = await confirmOrder(razorpayOrderId, razorpayPaymentId);
      
      return response.status(200).json({
        status: 'success',
        processed: result.success,
        alreadyProcessed: result.alreadyProcessed || false
      });
    } catch (err) {
      console.error('Webhook processing failed:', err);
      return response.status(500).json({ error: 'Webhook handler error' });
    }
  }

  return response.status(200).json({ status: 'ignored', event });
}
