import fs from 'fs';
import path from 'path';

const CLOUD_NAME = 'dpv40ou2c';
const UPLOAD_PRESET = 'g65f7lye';
const PROGRESS_FILE = 'scripts/cloudinary_upload_progress.json';

const plan = JSON.parse(fs.readFileSync('scripts/upload_plan_199.json', 'utf8'));

let progress = {};
if (fs.existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    console.log(`Loaded ${Object.keys(progress).length} previously uploaded items from progress file.`);
  } catch (e) {
    console.warn('Could not read existing progress file, starting fresh.');
  }
}

function saveProgress() {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function uploadSingle(item) {
  const key = `${item.productId}_${item.filename}`;
  if (progress[key] && progress[key].secure_url) {
    return progress[key];
  }

  const buffer = fs.readFileSync(item.localPath);
  const blob = new Blob([buffer], { type: 'image/webp' });
  const formData = new FormData();
  formData.append('file', blob, item.filename);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', item.cloudinaryFolder);
  formData.append('public_id', item.publicId);

  let attempts = 0;
  while (attempts < 4) {
    attempts++;
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.secure_url) {
        const result = {
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          productType: item.productType,
          shape: item.shape,
          material: item.material,
          sourceGroup: item.sourceGroup,
          filename: item.filename,
          color: item.color,
          role: item.role,
          public_id: data.public_id,
          secure_url: data.secure_url,
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes,
          created_at: data.created_at,
          uploaded_at: new Date().toISOString()
        };
        progress[key] = result;
        saveProgress();
        return result;
      } else {
        console.error(`Attempt ${attempts} failed for ${item.filename} in ${item.cloudinaryFolder}:`, data.error?.message || data);
      }
    } catch (err) {
      console.error(`Attempt ${attempts} network error for ${item.filename}:`, err.message);
    }
    // wait before retrying
    await new Promise(r => setTimeout(r, 1000 * attempts));
  }
  throw new Error(`Failed to upload ${item.filename} after ${attempts} attempts`);
}

async function runPool(items, concurrency = 5) {
  let index = 0;
  let completed = 0;
  let failed = 0;
  const total = items.length;

  console.log(`Starting Cloudinary upload of ${total} images with concurrency ${concurrency}...`);

  async function worker() {
    while (index < total) {
      const current = items[index++];
      try {
        const res = await uploadSingle(current);
        completed++;
        console.log(`[${completed}/${total}] ✓ (${res.productId}) ${res.filename} -> ${res.secure_url}`);
      } catch (err) {
        failed++;
        console.error(`[FAIL] ${current.productId} ${current.filename}:`, err.message);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  console.log(`\nUpload Pool Completed. Total: ${total}, Uploaded: ${completed}, Failed: ${failed}`);
  saveProgress();
}

runPool(plan, 6).catch(err => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});
