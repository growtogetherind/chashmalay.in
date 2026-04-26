const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'chashmalay.appspot.com'
});

async function fix() {
  try {
    const bucket = admin.storage().bucket();
    console.log(`Setting CORS for default bucket: ${bucket.name}`);
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
        origin: ['*'],
        responseHeader: ['*'],
      },
    ]);
    console.log('SUCCESS!');
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

fix();
