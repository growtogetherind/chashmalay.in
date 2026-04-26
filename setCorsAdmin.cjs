const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'chashmalay.firebasestorage.app'
});

async function configureCors() {
  const bucket = admin.storage().bucket();
  try {
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
        origin: ['*'],
        responseHeader: ['*'],
      },
    ]);
    console.log('Successfully set CORS configuration.');
  } catch (error) {
    console.error('Error setting CORS:', error.message);
  }
}

configureCors();
