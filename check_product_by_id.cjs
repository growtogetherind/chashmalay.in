const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const snap = await db.collection("products").where("name", "==", "0RX3929V 3207 P21 SHAD QT 1").get();
  if (snap.empty) {
    console.log("Product not found by exact name!");
    // Try substring match
    const all = await db.collection("products").get();
    all.docs.forEach(d => {
      if (d.data().name.includes("3929")) {
        console.log(`Match: ${d.data().name}`);
        console.log(`available_lenses:`, d.data().available_lenses);
      }
    });
  } else {
    snap.docs.forEach(d => {
      console.log(`Match: ${d.data().name}`);
      console.log(`available_lenses:`, d.data().available_lenses);
    });
  }
  process.exit(0);
}

check();
