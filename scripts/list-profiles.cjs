const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listProfiles() {
  const snapshot = await db.collection('profiles').get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

listProfiles();
