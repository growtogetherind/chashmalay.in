const fs = require('fs');
const path = require('path');

const CLOUD_NAME = 'dpv40ou2c';
const UPLOAD_PRESET = 'g65f7lye';

async function uploadFile(filePath, publicId) {
  const { default: FormData } = await import('form-data');
  const fetch = (await import('node-fetch')).default;

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', 'banners');
  form.append('public_id', publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  const data = await res.json();
  if (data.error) {
    console.error('Error uploading', publicId, ':', data.error.message);
    return null;
  }

  const optimized = data.secure_url.replace('/upload/', '/upload/q_auto/f_auto/c_scale,w_1400/');
  console.log(`\n✅ Uploaded: ${publicId}`);
  console.log(`   Raw URL:       ${data.secure_url}`);
  console.log(`   Optimized URL: ${optimized}`);
  return optimized;
}

async function main() {
  const assite = path.join(__dirname, '..', 'assite');
  console.log('Uploading banners from:', assite);

  const sg = await uploadFile(path.join(assite, 'sunglasses.png'), 'sunglasses_banner');
  const cl = await uploadFile(path.join(assite, 'contect_lens.png'), 'contact_lens_banner');

  console.log('\n\n=== COPY THESE URLS INTO Home.jsx ===');
  console.log('Sunglasses banner:', sg);
  console.log('Contact Lens banner:', cl);
}

main().catch(console.error);
