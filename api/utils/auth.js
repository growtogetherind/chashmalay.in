import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = join(process.cwd(), 'serviceAccountKey.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
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
    const userDoc = await db.collection('profiles').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data().is_admin !== true) {
      const err = new Error('Forbidden: Admin access required');
      err.statusCode = 403;
      throw err;
    }
    return decodedToken;
  } catch (error) {
    if (error.statusCode) throw error;
    console.error("Admin verification check failed:", error);
    const err = new Error('Internal Server Error');
    err.statusCode = 500;
    throw err;
  }
}
