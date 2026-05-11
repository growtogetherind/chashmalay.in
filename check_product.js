import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const q = query(collection(db, "products"));
  const snap = await getDocs(q);
  console.log("Total Products:", snap.size);
  snap.docs.forEach(doc => {
    const data = doc.data();
    if (data.name.includes("Krishna")) {
      console.log("=== PRODUCT MATCH ===");
      console.log("Name:", data.name);
      console.log("Images:", data.images);
      console.log("Legacy Image fields:", { frame_image: data.frame_image, model_image: data.model_image });
    }
  });
  process.exit(0);
}

check();
