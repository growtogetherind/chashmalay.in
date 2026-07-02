// api/create-order.js — Vercel Serverless Function
// Creates a Razorpay order server-side so the KEY_SECRET never touches the browser.

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const KEY_ID = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    console.error('Razorpay credentials not configured on server.');
    return response.status(500).json({ error: 'Payment gateway not configured on server.' });
  }

  const { amount, currency = 'INR', receipt } = request.body || {};

  // amount must be in paise and at least 100 (₹1)
  const parsedAmount = parseInt(amount, 10);
  if (!parsedAmount || parsedAmount < 100) {
    return response.status(400).json({ error: 'Invalid amount. Minimum is 100 paise (₹1).' });
  }

  const orderPayload = {
    amount: parsedAmount,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
  };

  try {
    const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.json().catch(() => ({}));
      console.error('Razorpay create-order error:', razorpayRes.status, errBody);

      if (razorpayRes.status === 401) {
        return response.status(401).json({ error: 'Payment gateway authentication failed.' });
      }
      return response.status(500).json({ error: 'Failed to create order with payment gateway.', details: errBody });
    }

    const order = await razorpayRes.json();

    return response.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('create-order internal error:', error);
    return response.status(500).json({ error: 'Internal server error.', details: error.message });
  }
}
