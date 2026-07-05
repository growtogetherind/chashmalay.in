import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, updateDoc, setDoc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

console.log("Initializing Firebase app with project ID:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTests() {
  console.log("\n--- Testing Firestore Rules ---\n");

  try {
    // 1. Sign out to test unauthenticated state
    await signOut(auth);
    console.log("Signed out. Testing unauthenticated prescription write...");
    try {
      await addDoc(collection(db, "prescriptions"), {
        guestId: "guest-some-id",
        image_url: "http://example.com/rx.jpg",
        status: "pending"
      });
      console.error("❌ FAILURE: Unauthenticated prescription write allowed!");
    } catch (err) {
      console.log("✅ SUCCESS: Unauthenticated prescription write rejected:", err.message);
    }

    // 2. Sign in anonymously
    console.log("\nSigning in anonymously...");
    const creds = await signInAnonymously(auth);
    const uid = creds.user.uid;
    console.log("Logged in anonymously. UID:", uid);

    // 3. Try to create prescription with wrong guestId
    console.log("\nTesting prescription creation with mismatching guestId...");
    try {
      await addDoc(collection(db, "prescriptions"), {
        guestId: "guest-not-my-uid",
        image_url: "http://example.com/rx.jpg"
      });
      console.error("❌ FAILURE: Creation with mismatching guestId allowed!");
    } catch (err) {
      console.log("✅ SUCCESS: Creation with mismatching guestId rejected:", err.message);
    }

    // 4. Try to create prescription with guestId matching but without the guest- prefix requirement in matches() if UID doesn't match
    console.log("\nTesting prescription creation with correct guestId, but no guest- prefix...");
    try {
      await addDoc(collection(db, "prescriptions"), {
        guestId: uid,
        image_url: "http://example.com/rx.jpg"
      });
      console.error("❌ FAILURE: Creation with guestId without guest- prefix allowed!");
    } catch (err) {
      console.log("✅ SUCCESS: Creation with guestId without guest- prefix rejected:", err.message);
    }

    // 5. Try to create prescription trying to set forbidden fields (e.g. verified or orderId)
    console.log("\nTesting prescription creation with forbidden fields (verified: true)...");
    try {
      await addDoc(collection(db, "prescriptions"), {
        guestId: uid.startsWith("guest-") ? uid : "guest-" + uid,
        verified: true,
        image_url: "http://example.com/rx.jpg"
      });
      console.error("❌ FAILURE: Creation with forbidden field 'verified' allowed!");
    } catch (err) {
      console.log("✅ SUCCESS: Creation with forbidden field 'verified' rejected:", err.message);
    }

    console.log("\nTesting prescription creation with forbidden fields (orderId: '123')...");
    try {
      await addDoc(collection(db, "prescriptions"), {
        guestId: uid.startsWith("guest-") ? uid : "guest-" + uid,
        orderId: "123",
        image_url: "http://example.com/rx.jpg"
      });
      console.error("❌ FAILURE: Creation with forbidden field 'orderId' allowed!");
    } catch (err) {
      console.log("✅ SUCCESS: Creation with forbidden field 'orderId' rejected:", err.message);
    }

    // 6. Test profiles self-promotion check
    console.log("\nTesting self-promotion block in profiles (trying to set is_admin: true)...");
    try {
      await setDoc(doc(db, "profiles", uid), {
        full_name: "Hacker User",
        is_admin: true
      });
      console.error("❌ FAILURE: Profile self-promotion allowed!");
    } catch (err) {
      console.log("✅ SUCCESS: Profile self-promotion rejected:", err.message);
    }

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    console.log("\nTests complete. Exiting...");
    process.exit(0);
  }
}

runTests();
