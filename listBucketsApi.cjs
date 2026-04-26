const { GoogleAuth } = require('google-auth-library');
const path = require('path');

async function listBuckets() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, 'serviceAccountKey.json'),
    scopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
  });

  const client = await auth.getClient();
  // Project ID is taken from service account
  const projectId = 'chashmalay';
  const url = `https://storage.googleapis.com/storage/v1/b?project=${projectId}`;

  try {
    const res = await client.request({ url });
    console.log('Buckets response:', JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error('Error listing buckets:', error.response?.data || error.message);
  }
}

listBuckets();
