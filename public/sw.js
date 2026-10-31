// public/sw.js - Service Worker for Mobile Lock Screen & Web Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push (FCM / Web Push API)
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (err) {
      payload = { title: '🚨 New Order Received!', body: event.data.text() };
    }
  }

  const title = payload.title || '🚨 New Order Received!';
  const options = {
    body: payload.body || 'A new order has been placed on Chashmalay.in',
    icon: payload.icon || '/assets/im/logo.webp',
    badge: payload.badge || '/assets/im/logo.webp',
    image: payload.image || undefined,
    vibrate: payload.vibrate || [400, 200, 400, 200, 600],
    tag: payload.tag || `order-${Date.now()}`,
    requireInteraction: true,
    renotify: true,
    silent: false,
    actions: [
      { action: 'open_order', title: '👁️ Open Order' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: {
      url: payload.url || '/admin/orders'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification tap / button clicks from OS Lock Screen or Notification Shade
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/admin/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          if (client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
