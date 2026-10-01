import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('===============================================================');
  console.log('Chashmalay Catalog Firestore Importer');
  console.log('===============================================================');
  console.error('\nUsage: node scripts/import-catalog-to-firestore.mjs <admin-email> <admin-password>\n');
  console.log('Example: node scripts/import-catalog-to-firestore.mjs admin@gmail.com yourpassword\n');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: "AIzaSyBv9Lm2xw_0jvBNWvOdFUx8PQxkg7soSec",
  authDomain: "chashmalay.firebaseapp.com",
  projectId: "chashmalay",
  storageBucket: "chashmalay.firebasestorage.app",
  messagingSenderId: "1048138384235",
  appId: "1:1048138384235:web:05acdaaa982d4e790e022e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log(`Authenticating as ${email}...`);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✓ Authenticated successfully as ${userCredential.user.email} (UID: ${userCredential.user.uid})`);
  } catch (err) {
    console.error(`✗ Authentication failed: ${err.message}`);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync('catalog.json', 'utf8'));
  console.log(`\nFound ${catalog.length} products in catalog.json. Beginning upload to live Firestore...\n`);

  let count = 0;
  for (const product of catalog) {
    count++;
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      console.log(`[${count}/${catalog.length}] ✓ Added "${product.name}" (SKU: ${product.sku}) -> Doc ID: ${docRef.id}`);
    } catch (err) {
      console.error(`[${count}/${catalog.length}] ✗ Error adding "${product.name}":`, err.message);
    }
  }

  console.log(`\n🎉 Finished! Successfully pushed ${count} products to the live store.`);
  process.exit(0);
}

main();
