const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function makeAdmin(uid) {
  try {
    await db.collection('profiles').doc(uid).update({
      is_admin: true,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Successfully made user ${uid} an admin.`);
  } catch (error) {
    console.error('Error updating profile:', error);
  }
}

const uid = process.argv[2];
if (!uid) {
  console.error('Please provide a UID as an argument.');
  process.exit(1);
}

makeAdmin(uid);
