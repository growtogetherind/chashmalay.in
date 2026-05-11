import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config();

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
  const cats = await getDocs(collection(db, "categories"));
  console.log("Categories found:", cats.size);
  cats.forEach(doc => console.log("- ", doc.data().name));
  
  const brands = await getDocs(collection(db, "brands"));
  console.log("Brands found:", brands.size);
  brands.forEach(doc => console.log("- ", doc.data().name));
  
  process.exit(0);
}

check();
