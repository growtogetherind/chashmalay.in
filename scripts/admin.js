import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// You must download this file from Firebase Console -> Project Settings -> Service Accounts
// And place it in the root or a 'config' directory.
const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
