const { Storage } = require('@google-cloud/storage');
const path = require('path');

async function listBuckets() {
  const storage = new Storage({
    keyFilename: path.join(__dirname, 'serviceAccountKey.json'),
  });

  const [buckets] = await storage.getBuckets();
  console.log('Buckets:');
  buckets.forEach(bucket => {
    console.log(bucket.name);
  });
}

listBuckets().catch(console.error);
