import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Manually parse .env file to ensure zero external dependency issues
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const index = trimmed.indexOf("=");
      if (index === -1) return;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).replace(/\r$/, "").trim();
      // Remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    });
  }
} catch (e) {
  console.warn("⚠️ Failed to manually parse .env file:", e.message);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to recursively collect all image URLs from a document data object
function extractUrls(obj, urlSet) {
  if (!obj) return;
  if (typeof obj === 'string') {
    const str = obj.trim();
    if (
      str.startsWith('http://') || 
      str.startsWith('https://') || 
      str.includes('cloudinary.com') ||
      str.includes('firebasestorage.googleapis.com') ||
      /\.(jpg|jpeg|png|webp|svg|gif)($|\?)/i.test(str)
    ) {
      urlSet.add(str);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractUrls(item, urlSet));
  } else if (typeof obj === 'object') {
    Object.values(obj).forEach(val => extractUrls(val, urlSet));
  }
}

async function countDatabaseImages() {
  const collections = ["products", "categories", "brands", "carousel", "offers"];
  const dbUrls = new Set();
  const collectionCounts = {};

  console.log("🔍 Fetching data from Firestore collections...");
  for (const collName of collections) {
    try {
      const snap = await getDocs(collection(db, collName));
      collectionCounts[collName] = { docs: snap.size, urls: new Set() };
      snap.forEach(doc => {
        const data = doc.data();
        extractUrls(data, dbUrls);
        extractUrls(data, collectionCounts[collName].urls);
      });
      console.log(`   ✅ ${collName}: found ${snap.size} documents, containing ${collectionCounts[collName].urls.size} unique image URLs.`);
    } catch (e) {
      console.warn(`   ⚠️ Failed to read collection "${collName}":`, e.message);
    }
  }

  const allUrls = Array.from(dbUrls);
  const cloudinaryUrls = allUrls.filter(url => url.includes('cloudinary.com'));
  const firebaseUrls = allUrls.filter(url => url.includes('firebasestorage.googleapis.com'));
  const otherUrls = allUrls.filter(url => !url.includes('cloudinary.com') && !url.includes('firebasestorage.googleapis.com'));

  console.log("\n==========================================");
  console.log("📊 FIRESTORE DATABASE IMAGE SUMMARY");
  console.log("==========================================");
  console.log(`Total Unique Image URLs in DB:   ${allUrls.length}`);
  console.log(`- Cloudinary hosted images:       ${cloudinaryUrls.length}`);
  cloudinaryUrls.forEach((url, i) => console.log(`  [${i+1}] ${url}`));
  console.log(`- Firebase hosted images:         ${firebaseUrls.length}`);
  console.log(`- Other external hosted images:   ${otherUrls.length}`);
  console.log("==========================================\n");

  return {
    totalDbImages: allUrls.length,
    cloudinaryDbImages: cloudinaryUrls.length
  };
}

async function countCloudinaryImages() {
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.log("❌ Missing Cloudinary API credentials in .env file (need Cloud name, API Key, and API Secret).");
    return null;
  }

  console.log("🔍 Fetching image resources from Cloudinary Admin API...");
  let totalCloudinaryResources = 0;
  let nextCursor = null;
  let pageCount = 1;

  try {
    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    do {
      let url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?max_results=500`;
      if (nextCursor) {
        url += `&next_cursor=${encodeURIComponent(nextCursor)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': authHeader
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const count = data.resources?.length || 0;
      totalCloudinaryResources += count;
      console.log(`   Page ${pageCount++}: fetched ${count} images...`);

      nextCursor = data.next_cursor;
    } while (nextCursor);

    console.log("\n==========================================");
    console.log("☁️ CLOUDINARY CLOUD STORAGE SUMMARY");
    console.log("==========================================");
    console.log(`Total Images stored on Cloudinary: ${totalCloudinaryResources}`);
    console.log("==========================================\n");
    
    return totalCloudinaryResources;

  } catch (error) {
    console.error("❌ Cloudinary API error:", error.message);
    return null;
  }
}

async function run() {
  const dbStats = await countDatabaseImages();
  const cldStats = await countCloudinaryImages();
  
  if (dbStats && cldStats !== null) {
    console.log("🏁 COMPREHENSIVE STATUS");
    console.log("==========================================");
    console.log(`Active Images in Database:    ${dbStats.totalDbImages}`);
    console.log(`Of which are Cloudinary URLs: ${dbStats.cloudinaryDbImages}`);
    console.log(`Total Images on Cloudinary:   ${cldStats}`);
    console.log(`Orphaned/unused Cloudinary:  ${Math.max(0, cldStats - dbStats.cloudinaryDbImages)} images`);
    console.log("==========================================\n");
  }
  process.exit(0);
}

run();
