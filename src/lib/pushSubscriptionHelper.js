// src/lib/pushSubscriptionHelper.js
// Manages Web Push (VAPID) subscription on the Admin device so that
// notifications arrive even when the browser is completely closed.

import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BHrt5Obw1fsSEK4CF21_gTSBUWQt10jJsnG9GLbTNqsz3sOlBNIIao19bR70mkyXb4b0Rie4q2udAEFrqB_Wa6I';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToWebPush = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Web Push is not supported in this browser.');
    return null;
  }

  // 1. Request permission
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  // 2. Get active service worker registration
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }
  const readyReg = await navigator.serviceWorker.ready;

  // 3. Get existing subscription or create a new one
  let sub = await readyReg.pushManager.getSubscription();
  if (!sub) {
    const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    sub = await readyReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });
  }

  const rawSub = JSON.parse(JSON.stringify(sub));
  const subId = btoa(sub.endpoint).replace(/[/+=]/g, '_').slice(-40);

  // 4. Save to Firestore admin_push_subscriptions collection directly
  try {
    const user = auth.currentUser;
    await setDoc(doc(db, 'admin_push_subscriptions', subId), {
      endpoint: rawSub.endpoint,
      keys: rawSub.keys,
      userAgent: navigator.userAgent || 'Unknown',
      adminUid: user ? user.uid : null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (fsErr) {
    console.warn('Could not save push subscription to Firestore directly:', fsErr.message);
  }

  // 5. Also save via API endpoint with auth token if available
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken().catch(() => null) : null;
    await fetch('/api/save-push-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        subscription: rawSub,
        userAgent: navigator.userAgent
      })
    });
  } catch (apiErr) {
    console.warn('Could not save push subscription via API:', apiErr.message);
  }

  localStorage.setItem('admin_push_subscribed', 'true');
  return sub;
};
