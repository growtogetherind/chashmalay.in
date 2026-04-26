
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAndFixProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));
  console.log(`Found ${querySnapshot.size} products.`);
  
  const shapes = ['Round', 'Square', 'Rectangle', 'Cat Eye', 'Geometric', 'Aviator'];
  const types = ['Full Rim', 'Rimless', 'Half Rim'];
  const colors = ['Black', 'Gold', 'Silver', 'Gunmetal', 'Transparent', 'Brown', 'Blue', 'Rose Gold'];

  for (const productDoc of querySnapshot.docs) {
    const data = productDoc.data();
    const updates = {};
    
    if (!data.frame_shape && !data.shape) {
      updates.frame_shape = shapes[Math.floor(Math.random() * shapes.length)];
    }
    if (!data.frame_type) {
      updates.frame_type = types[Math.floor(Math.random() * types.length)];
    }
    if (!data.color) {
      updates.color = colors[Math.floor(Math.random() * colors.length)];
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Updating product ${productDoc.id} with:`, updates);
      await updateDoc(doc(db, "products", productDoc.id), updates);
    }
  }
}

checkAndFixProducts().then(() => console.log("Done."));
