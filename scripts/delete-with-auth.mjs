// scripts/delete-with-auth.mjs
// Run with: node scripts/delete-with-auth.mjs <admin-email> <admin-password>

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/delete-with-auth.mjs <admin-email> <admin-password>");
  process.exit(1);
}

const PROJECT_ID = "chashmalay";
const API_KEY = "AIzaSyBv9Lm2xw_0jvBNWvOdFUx8PQxkg7soSec";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getAdminToken() {
  console.log(`Authenticating as ${email}...`);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Authentication failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log("✓ Authenticated successfully as Admin!");
  return data.idToken;
}

async function getCollectionDocs(collectionName, token) {
  const url = `${BASE_URL}/${collectionName}?pageSize=300`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to list ${collectionName}: ${res.status} ${text}`);
    return [];
  }
  const data = await res.json();
  return data.documents || [];
}

async function deleteDoc(docName, token) {
  const url = `https://firestore.googleapis.com/v1/${docName}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete ${docName}: ${res.status} ${text}`);
  }
}

async function main() {
  try {
    const token = await getAdminToken();
    const collections = ["products", "orders", "order_items", "prescriptions", "reviews"];

    for (const col of collections) {
      console.log(`\nFetching documents from '${col}'...`);
      const docs = await getCollectionDocs(col, token);
      console.log(`Found ${docs.length} documents in '${col}'`);

      let deleted = 0;
      for (const d of docs) {
        try {
          await deleteDoc(d.name, token);
          deleted++;
          console.log(`  ✓ Deleted ${d.name.split('/').pop()}`);
        } catch (err) {
          console.error(`  ✗ ${err.message}`);
        }
      }
      console.log(`Done '${col}': successfully deleted ${deleted}/${docs.length}`);
    }

    console.log("\n🎉 ALL specified products, orders, prescriptions, and reviews have been permanently deleted!");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
