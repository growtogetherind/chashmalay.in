import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

if (!admin.apps.length) {
  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : process.env.FIREBASE_SERVICE_ACCOUNT;
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } catch (e) {
        console.warn("Invalid FIREBASE_SERVICE_ACCOUNT format. Initializing with projectId fallback:", e.message);
        admin.initializeApp({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'chashmalay'
        });
      }
    } else {
      const serviceAccountPath = join(process.cwd(), 'serviceAccountKey.json');
      if (existsSync(serviceAccountPath)) {
        try {
          serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
        } catch (e) {
          console.warn("Error parsing serviceAccountKey.json:", e.message);
          admin.initializeApp({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'chashmalay'
          });
        }
      } else {
        // Fallback for local dev when running without a physical service account file
        const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'chashmalay';
        admin.initializeApp({
          projectId
        });
      }
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'chashmalay'
        });
      } catch (fallbackErr) {
        console.error("Critical fallback init failed:", fallbackErr);
      }
    }
  }
}

export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;
export { admin };

export async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Unauthorized: Missing or malformed Authorization header');
    err.statusCode = 401;
    throw err;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("verifyIdToken failed:", error);
    const err = new Error('Unauthorized: Invalid token');
    err.statusCode = 401;
    throw err;
  }
}

export async function verifyAdmin(req) {
  const decodedToken = await verifyAuth(req);
  
  try {
    // 1. Direct admin check by trusted admin email configuration
    const adminEmails = (process.env.VITE_ADMIN_EMAILS || 'chashmalayshorts@gmail.com,admin@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase());

    if (decodedToken.email && adminEmails.includes(decodedToken.email.toLowerCase())) {
      return decodedToken;
    }

    // 2. Database profile check if Firestore is accessible
    if (db) {
      const userDoc = await db.collection('profiles').doc(decodedToken.uid).get();
      if (userDoc.exists && userDoc.data().is_admin === true) {
        return decodedToken;
      }
    }

    const err = new Error('Forbidden: Admin access required');
    err.statusCode = 403;
    throw err;
  } catch (error) {
    if (error.statusCode) throw error;
    console.error("Admin verification check failed:", error);
    const err = new Error('Internal Server Error');
    err.statusCode = 500;
    throw err;
  }
}

