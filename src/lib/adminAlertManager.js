// src/lib/adminAlertManager.js
// Provides continuous audible chime, mobile vibration, and lock screen OS notifications
// for incoming orders until acknowledged/dismissed by the administrator.

let audioCtx = null;
let alertIntervalId = null;
let currentAlert = null;
const listeners = new Set();

export const registerAdminServiceWorker = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      return reg;
    } catch (err) {
      console.warn('SW registration skipped:', err);
      return null;
    }
  }
  return null;
};

const getAudioContext = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Play a distinct high-priority 3-tone melodic chime
export const playSingleChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playTone = (freq, duration, delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    // Upward attention-grabbing chime
    playTone(659.25, 0.35, 0);       // E5
    playTone(880.00, 0.45, 0.12);     // A5
    playTone(1174.66, 0.6, 0.26);    // D6
  } catch (err) {
    console.warn('Audio alert error:', err);
  }
};

// Mobile vibration pattern (works on Android Chrome/Firefox/PWA)
const triggerVibration = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([350, 150, 350, 150, 600]);
    } catch {
      // Ignore vibration errors if restricted
    }
  }
};

const notifyListeners = () => {
  listeners.forEach(fn => fn(currentAlert));
};

export const subscribeAlertState = (callback) => {
  listeners.add(callback);
  callback(currentAlert);
  return () => listeners.delete(callback);
};

export const showLockScreenNotification = async (order) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') {
    try {
      const res = await Notification.requestPermission();
      if (res !== 'granted') return;
    } catch {
      return;
    }
  }

  const orderIdShort = (order.id || '').slice(0, 8).toUpperCase();
  const customer = order.profiles?.full_name || order.shipping_address?.name || 'Customer';
  const amount = Number(order.total_amount || 0).toLocaleString();
  const firstItem = order.order_items?.[0] || {};
  const photo = firstItem.frame_image || firstItem.image || firstItem.images?.front || (firstItem.images?.gallery && firstItem.images.gallery[0]);

  const title = `🚨 New Order #${orderIdShort} (₹${amount})`;
  const options = {
    body: `${customer} placed an order for ${firstItem.product_name || 'Eyewear'}. Tap to review!`,
    icon: '/assets/im/logo.webp',
    badge: '/assets/im/logo.webp',
    vibrate: [400, 200, 400, 200, 600],
    tag: `order-${order.id}`,
    requireInteraction: true,
    renotify: true,
    silent: false,
    actions: [
      { action: 'open_order', title: '👁️ Open Order' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: { url: '/admin/orders' }
  };

  if (photo) {
    options.image = photo;
  }

  try {
    if ('serviceWorker' in navigator) {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch (err) {
    console.warn('Lock screen notification trigger notice:', err);
    try {
      new Notification(title, options);
    } catch {
      // fallback
    }
  }
};

export const sendTestLockScreenNotification = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser.');
  }

  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }
  if (perm !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const title = '🚨 Test Lock Screen Notification';
  const options = {
    body: 'Lock Screen notification & vibration are fully active for orders!',
    icon: '/assets/im/logo.webp',
    badge: '/assets/im/logo.webp',
    vibrate: [400, 200, 400, 200, 600],
    tag: 'test-order-alert',
    requireInteraction: true,
    renotify: true,
    silent: false,
    actions: [
      { action: 'open_order', title: '👁️ Open Orders' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: { url: '/admin/orders' }
  };

  try {
    if ('serviceWorker' in navigator) {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        playSingleChime();
        triggerVibration();
        return true;
      }
    }
    new Notification(title, options);
    playSingleChime();
    triggerVibration();
    return true;
  } catch (err) {
    console.warn('Test lock screen notification error:', err);
    new Notification(title, options);
    playSingleChime();
    return true;
  }
};

export const startContinuousOrderAlert = (order) => {
  if (!order) return;

  currentAlert = {
    id: order.id,
    orderIdShort: (order.id || '').slice(0, 8).toUpperCase(),
    customer: order.profiles?.full_name || order.shipping_address?.name || 'Customer',
    amount: order.total_amount || 0,
    itemCount: order.order_items?.length || 1,
    timestamp: Date.now()
  };

  notifyListeners();

  // Show lock screen OS notification with photo
  showLockScreenNotification(order);

  // Play immediately
  playSingleChime();
  triggerVibration();

  // Clear any existing repeating loop
  if (alertIntervalId) {
    clearInterval(alertIntervalId);
  }

  // Continuously ring and vibrate every 2.8 seconds until dismissed
  alertIntervalId = setInterval(() => {
    playSingleChime();
    triggerVibration();
  }, 2800);
};

export const stopContinuousOrderAlert = () => {
  if (alertIntervalId) {
    clearInterval(alertIntervalId);
    alertIntervalId = null;
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(0); // Cancel vibration
    } catch {}
  }
  currentAlert = null;
  notifyListeners();
};
