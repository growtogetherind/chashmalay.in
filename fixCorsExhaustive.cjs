const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename: path.join(__dirname, 'serviceAccountKey.json'),
});

const corsConfiguration = [
  {
    maxAgeSeconds: 3600,
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
    origin: ['*'],
    responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
  },
];

async function trySetCors(bucketName) {
  try {
    console.log(`Setting CORS for: ${bucketName}...`);
    await storage.bucket(bucketName).setCorsConfiguration(corsConfiguration);
    console.log(`SUCCESS: ${bucketName} CORS updated.`);
    return true;
  } catch (e) {
    console.error(`FAILED: ${bucketName} - ${e.message}`);
    return false;
  }
}

async function run() {
  const buckets = [
    'chashmalay.firebasestorage.app',
    'chashmalay.appspot.com',
    'chashmaly.firebasestorage.app',
    'chashmaly.appspot.com',
    'chashmaly-in.firebasestorage.app',
    'chashmaly-in.appspot.com'
  ];

  for (const b of buckets) {
    if (await trySetCors(b)) {
      console.log('Stopping early as one bucket succeeded.');
      // return; // Optional: try all just in case
    }
  }
}

run();
