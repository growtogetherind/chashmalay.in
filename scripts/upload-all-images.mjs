import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CLOUD_NAME = 'dpv40ou2c';
const UPLOAD_PRESET = 'g65f7lye';
const CACHE_FILE = 'scripts/cloudinary-upload-cache.json';

// Load cache if exists
let uploadCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    uploadCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    console.log(`Loaded ${Object.keys(uploadCache).length} cached uploads from ${CACHE_FILE}`);
  } catch (e) {
    console.warn('Could not read cache, starting fresh');
  }
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(uploadCache, null, 2));
}

// 1. Scan folders
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

console.log(`Found total ${allFiles.length} images (${f1Files.length} in Folder 1, ${f2Files.length} in Folder 2)`);

// Check duplicates
const hashToFileMap = new Map();
let duplicateCount = 0;
for (const item of allFiles) {
  if (hashToFileMap.has(item.hash)) {
    duplicateCount++;
  } else {
    hashToFileMap.set(item.hash, item);
  }
}
console.log(`Unique image files: ${hashToFileMap.size}, Duplicate files: ${duplicateCount}`);

async function uploadFileToCloudinary(item, folderTarget = 'chashmalay/products') {
  // If already in cache by hash, reuse
  if (uploadCache[item.hash]) {
    return uploadCache[item.hash];
  }

  const buffer = fs.readFileSync(item.filepath);
  const blob = new Blob([buffer], { type: 'image/webp' });
  const formData = new FormData();
  formData.append('file', blob, item.filename);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folderTarget);

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
        const result = {
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
        uploadCache[item.hash] = result;
        saveCache();
        return result;
      } else {
        console.error(`Upload error for ${item.filename} (attempt ${attempts}):`, data.error?.message || data);
      }
    } catch (err) {
      console.error(`Network error for ${item.filename} (attempt ${attempts}):`, err.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Failed to upload ${item.filename} after 3 attempts`);
}

// Upload runner with concurrency
async function uploadAllWithConcurrency(items, concurrency = 6) {
  const results = [];
  let index = 0;
  const total = items.length;

  async function worker() {
    while (index < total) {
      const currentIndex = index++;
      const item = items[currentIndex];
      const isCached = !!uploadCache[item.hash];
      try {
        const uploadResult = await uploadFileToCloudinary(item);
        results.push(uploadResult);
        console.log(`[${currentIndex + 1}/${total}] ${isCached ? '(Cached)' : 'Uploaded'} ${item.filename} -> ${uploadResult.url}`);
      } catch (err) {
        console.error(`Failed ${item.filename}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('Starting Cloudinary batch upload...');
  const startTime = Date.now();
  await uploadAllWithConcurrency(allFiles, 8);
  console.log(`Batch upload finished in ${((Date.now() - startTime) / 1000).toFixed(1)}s! Total cached: ${Object.keys(uploadCache).length}`);
}

main();
