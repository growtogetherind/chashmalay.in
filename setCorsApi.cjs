const { GoogleAuth } = require('google-auth-library');
const path = require('path');

async function setCors() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, 'serviceAccountKey.json'),
    scopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
  });

  const client = await auth.getClient();
  // Try appspot format
  const buckets = ['chashmalay.appspot.com', 'chashmalay.firebasestorage.app'];
  
  for (const bucketName of buckets) {
      console.log(`Trying ${bucketName}...`);
      const url = `https://storage.googleapis.com/storage/v1/b/${bucketName}`;
      try {
        const res = await client.request({
          url,
          method: 'PATCH',
          data: {
            cors: [
              {
                origin: ['*'],
                method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
                responseHeader: ['*'],
                maxAgeSeconds: 3600,
              },
            ],
          },
        });
        console.log(`Successfully set CORS configuration for ${bucketName}`);
      } catch (error) {
        console.error(`Error for ${bucketName}:`, error.response?.data?.error?.message || error.message);
      }
  }
}

setCors();
