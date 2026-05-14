import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

// Read .env
const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const eyeglasses = products.filter(p => (p.category || '').toLowerCase() === 'eyeglasses');
  console.log(`Found ${eyeglasses.length} eyeglasses`);
  
  eyeglasses.forEach(p => {
     console.log(`Product: ${p.name}`);
     console.log(`  Shape: ${p.frame_shape || p.shape}`);
     console.log(`  Type: ${p.frame_type || p.frameType}`);
     console.log(`  Theme: ${p.theme}`);
     console.log(`  Colors:`, p.colors);
  });
}

run();
