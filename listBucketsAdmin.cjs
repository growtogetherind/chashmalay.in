const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function listBuckets() {
  try {
    const [buckets] = await admin.storage().getBuckets();
    if (buckets.length === 0) {
      console.log('NO BUCKETS FOUND IN THIS PROJECT.');
    } else {
      console.log('Buckets found:');
      buckets.forEach(bucket => console.log(bucket.name));
    }
  } catch (error) {
    console.error('Error listing buckets:', error.message);
  }
}

listBuckets();
