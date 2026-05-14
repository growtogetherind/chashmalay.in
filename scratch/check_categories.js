const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCategories() {
  const snapshot = await db.collection('products').get();
  const categories = new Set();
  snapshot.forEach(doc => {
    categories.add(doc.data().category);
  });
  console.log('Categories found:', Array.from(categories));
}

checkCategories();
