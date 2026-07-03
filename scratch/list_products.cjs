const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const snap = await db.collection("products").limit(10).get();
  console.log("Total Products:", snap.size);
  snap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Price: ${data.price}`);
    console.log(`  Images:`, data.images);
    console.log(`  isNew: ${data.isNew}, isFeatured: ${data.isFeatured}`);
  });
  process.exit(0);
}

check();
