import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

// Initialize Firebase Admin
const serviceAccountPath = join(process.cwd(), "serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function runAudit() {
  console.log("Starting prescription audit...");
  
  const prescriptionsSnap = await db.collection("prescriptions").get();
  console.log(`Total prescription documents found: ${prescriptionsSnap.size}`);
  
  let orphanedCount = 0;
  const orphanedDocs = [];

  for (const doc of prescriptionsSnap.docs) {
    const rx = doc.data();
    const orderId = rx.order_id;
    
    if (!orderId) {
      orphanedCount++;
      orphanedDocs.push({ id: doc.id, reason: "No order_id field", data: rx });
      continue;
    }

    // Check if the order document exists
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      orphanedCount++;
      orphanedDocs.push({ id: doc.id, reason: `Order ID ${orderId} does not exist`, data: rx });
    }
  }

  console.log(`\nAudit Complete.`);
  console.log(`Orphaned prescriptions count: ${orphanedCount}`);
  if (orphanedCount > 0) {
    console.log("\nDetails of orphaned prescriptions:");
    orphanedDocs.forEach(od => {
      console.log(`- Doc ID: ${od.id} | Reason: ${od.reason} | User: ${od.data.user_name} (${od.data.user_id})`);
    });
  }
  
  process.exit(0);
}

runAudit().catch(err => {
  console.error("Audit failed:", err);
  process.exit(1);
});
