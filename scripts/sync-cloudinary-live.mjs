import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CLOUD_NAME = 'dpv40ou2c';
const UPLOAD_PRESET = 'g65f7lye';
const CACHE_FILE = 'scripts/cloudinary-upload-cache.json';

// Scan folders
function getFolderFiles(folderName) {
  if (!fs.existsSync(folderName)) return [];
  return fs.readdirSync(folderName)
    .filter(f => f.toLowerCase().endsWith('.webp') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'))
    .map(f => {
      const filePath = path.join(folderName, f);
      const buffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      return {
        folder: folderName,
        filename: f,
        filepath: filePath,
        size: buffer.length,
        hash
      };
    });
}

const f1Files = getFolderFiles('Chashmalay img 1');
const f2Files = getFolderFiles('Chashmalay img 2');
const allFiles = [...f1Files, ...f2Files];

console.log(`Found total ${allFiles.length} images to sync to Cloudinary (${f1Files.length} in Folder 1, ${f2Files.length} in Folder 2).`);

// Upload cache
let uploadCache = {};

async function uploadFile(item) {
  const buffer = fs.readFileSync(item.filepath);
  const ext = path.extname(item.filename).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : (ext === '.png' ? 'image/png' : 'image/webp');
  const blob = new Blob([buffer], { type: mimeType });

  const formData = new FormData();
  formData.append('file', blob, item.filename);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'chashmalay/products');

  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.secure_url) {
        return {
          url: data.secure_url,
          public_id: data.public_id,
          format: data.format,
          width: data.width,
          height: data.height,
          folder: item.folder,
          filename: item.filename,
          filepath: item.filepath,
          hash: item.hash
        };
      } else {
        console.error(`Upload error for ${item.filename} (attempt ${attempts}):`, data.error?.message || data);
      }
    } catch (err) {
      console.error(`Network error for ${item.filename} (attempt ${attempts}):`, err.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Failed to upload ${item.filename}`);
}

async function main() {
  const startTime = Date.now();
  const results = [];
  let index = 0;
  const total = allFiles.length;
  const concurrency = 6;

  async function worker() {
    while (index < total) {
      const currentIndex = index++;
      const item = allFiles[currentIndex];
      try {
        const uploadResult = await uploadFile(item);
        uploadCache[item.hash] = uploadResult;
        uploadCache[item.filename] = uploadResult; // also index by filename for convenience
        results.push(uploadResult);
        if (results.length % 20 === 0 || results.length === total) {
          console.log(`[${results.length}/${total}] Uploaded ${item.filename} -> ${uploadResult.url}`);
          fs.writeFileSync(CACHE_FILE, JSON.stringify(uploadCache, null, 2));
        }
      } catch (err) {
        console.error(`Failed ${item.filename}:`, err.message);
      }
    }
  }

  console.log(`Beginning upload of ${total} images with concurrency ${concurrency}...`);
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  fs.writeFileSync(CACHE_FILE, JSON.stringify(uploadCache, null, 2));
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Successfully uploaded ${results.length}/${total} images to Cloudinary in ${elapsed}s!`);
}

main();
