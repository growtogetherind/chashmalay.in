import { verifyAuth } from './utils/auth.js';

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await verifyAuth(request);
  } catch (authError) {
    return response.status(authError.statusCode || 401).json({ error: authError.message });
  }

  const { phoneNumber, customerName, orderId, amount } = request.body || {};

  if (!phoneNumber || !customerName || !orderId || !amount) {
    return response.status(400).json({ error: 'Missing required parameters' });
  }

  // Load the API Key securely from the server environment. Prefer the
  // non-VITE_ name (server-only); fall back to the legacy VITE_ name so existing
  // deployments keep working, but that legacy name should be removed once the
  // Vercel env is updated — a VITE_-prefixed var leaks into the client bundle.
  const API_KEY = process.env.FAST2SMS_API_KEY || process.env.VITE_FAST2SMS_API_KEY;
  const SENDER_ID = process.env.FAST2SMS_SENDER_ID || process.env.VITE_FAST2SMS_SENDER_ID || "FSTSMS";

  if (!API_KEY) {
    return response.status(500).json({ error: 'Fast2SMS API Key not configured on server' });
  }

  const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);
  const message = `Dear ${customerName}, your order #${orderId} of Rs. ${Math.round(amount)} has been successfully placed. Thank you for shopping with chashmaly.in!`;

  try {
    const params = new URLSearchParams();
    params.append("route", "q");
    params.append("message", message);
    params.append("numbers", cleanPhone);
    params.append("language", "english");
    params.append("flash", "0");

    if (SENDER_ID) {
      params.append("sender_id", SENDER_ID);
    }

    const fast2smsResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
      },
      body: params
    });

    const data = await fast2smsResponse.json();

    if (!data.return) {
      return response.status(400).json({ error: 'Fast2SMS returned failure', details: data });
    }

    return response.status(200).json({ success: true, message: 'SMS sent successfully via backend proxy', details: data });
  } catch (error) {
    console.error("Fast2SMS Proxy Error:", error);
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
