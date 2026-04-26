const { Storage } = require('@google-cloud/storage');
const path = require('path');

async function listAll() {
  const storage = new Storage({
    keyFilename: path.join(__dirname, 'serviceAccountKey.json'),
  });

  try {
    const [projects] = await storage.getServiceAccount();
    console.log('Project ID from Service Account:', projects);
  } catch (e) {
    console.error('Auth check failed:', e.message);
  }

  try {
    const [buckets] = await storage.getBuckets();
    console.log('Available Buckets:');
    buckets.forEach(b => console.log(' - ' + b.name));
  } catch (e) {
    console.error('Bucket listing failed:', e.message);
  }
}

listAll();
