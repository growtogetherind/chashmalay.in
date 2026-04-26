const { Storage } = require('@google-cloud/storage');
const path = require('path');

async function configureCors() {
  const storage = new Storage({
    keyFilename: path.join(__dirname, 'serviceAccountKey.json'),
  });

  const bucketName = 'chashmalay.appspot.com';

  await storage.bucket(bucketName).setCorsConfiguration([
    {
      maxAgeSeconds: 3600,
      method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      origin: ['*'],
      responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
    },
  ]);

  console.log(`Bucket ${bucketName} was updated with a CORS config to allow references from all domains.`);
}

configureCors().catch(console.error);
