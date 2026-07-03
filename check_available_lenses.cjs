const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const snap = await db.collection("products").limit(5).get();
  snap.docs.forEach(d => {
    console.log(`- Product: ${d.data().name}`);
    console.log(`  available_lenses:`, d.data().available_lenses);
  });
  process.exit(0);
}

check();
