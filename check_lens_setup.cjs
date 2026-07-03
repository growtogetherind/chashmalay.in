const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const cats = await db.collection("lens_categories").get();
  console.log("Categories in DB:");
  cats.docs.forEach(d => console.log(`- ID: ${d.id}, Name: ${d.data().name}, Slug: ${d.data().slug}, is_active: ${d.data().is_active}`));

  const lenses = await db.collection("lenses").get();
  console.log("\nLenses in DB (first 5):");
  lenses.docs.slice(0, 5).forEach(d => console.log(`- Name: ${d.data().name}, Cat ID: ${d.data().category_id}`));

  const addons = await db.collection("lens_addons").get();
  console.log("\nAddons in DB (first 5):");
  addons.docs.slice(0, 5).forEach(d => console.log(`- Name: ${d.data().name}, Group: ${d.data().group}`));

  process.exit(0);
}

check();
