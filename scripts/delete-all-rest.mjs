const PROJECT_ID = "chashmalay";
const API_KEY = "AIzaSyBv9Lm2xw_0jvBNWvOdFUx8PQxkg7soSec";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const collections = ["products", "orders", "order_items", "prescriptions", "reviews"];

async function getCollectionDocs(collectionName) {
  const url = `${BASE_URL}/${collectionName}?key=${API_KEY}&pageSize=300`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to list ${collectionName}: ${res.status} ${text}`);
    return [];
  }
  const data = await res.json();
  return data.documents || [];
}

async function deleteDoc(docName) {
  const url = `https://firestore.googleapis.com/v1/${docName}?key=${API_KEY}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete ${docName}: ${res.status} ${text}`);
  }
}

async function main() {
  console.log("🚀 Starting Firestore Wipe via REST API...");

  for (const col of collections) {
    console.log(`\nFetching documents from '${col}'...`);
    const docs = await getCollectionDocs(col);
    console.log(`Found ${docs.length} documents in '${col}'`);

    let deleted = 0;
    for (const d of docs) {
      try {
        await deleteDoc(d.name);
        deleted++;
        console.log(`  ✓ Deleted ${d.name.split('/').pop()}`);
      } catch (err) {
        console.error(`  ✗ ${err.message}`);
      }
    }
    console.log(`Done '${col}': deleted ${deleted}/${docs.length}`);
  }

  console.log("\n✅ All specified collections have been cleared!");
}

main();
