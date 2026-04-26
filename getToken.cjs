const { GoogleAuth } = require('google-auth-library');
const path = require('path');

async function getAuthToken() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, 'serviceAccountKey.json'),
    scopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  console.log(token.token);
}

getAuthToken();
