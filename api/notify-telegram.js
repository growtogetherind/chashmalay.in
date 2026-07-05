// api/notify-telegram.js — Vercel Serverless Function
// Proxies admin notifications to Telegram so the BOT TOKEN and CHAT ID never
// reach the browser. Credentials are read from server environment variables.
//
// Required env vars (set in Vercel → Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN   the bot token from @BotFather
//   TELEGRAM_CHAT_ID     the destination chat id
// (Legacy VITE_-prefixed names are accepted as a fallback but are deprecated —
//  never expose these to the client bundle.)

import { verifyAuth } from './utils/auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await verifyAuth(request);
  } catch (authError) {
    return response.status(authError.statusCode || 401).json({ error: authError.message });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    // Not configured — treat as a no-op success so notifications are optional
    // and never surface an error to the customer-facing flow.
    return response.status(200).json({ success: false, skipped: true, reason: 'not_configured' });
  }

  const { message, reply_markup } = request.body || {};

  if (!message || typeof message !== 'string') {
    return response.status(400).json({ error: 'A non-empty "message" string is required.' });
  }

  // Cap message length defensively (Telegram limit is 4096 chars).
  const text = message.slice(0, 4096);

  const payload = {
    chat_id: CHAT_ID,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: false,
  };
  if (reply_markup && typeof reply_markup === 'object') {
    payload.reply_markup = reply_markup;
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await tgRes.json().catch(() => ({}));

    if (!tgRes.ok || !data.ok) {
      console.error('Telegram sendMessage failed:', tgRes.status, data?.description);
      return response.status(502).json({ error: 'Telegram delivery failed.' });
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('notify-telegram internal error:', error);
    return response.status(500).json({ error: 'Internal server error.' });
  }
}
