import { db, auth } from "./admin.js";

const adminEmail = "admin@gmail.com";

async function checkAdmin() {
  try {
    const user = await auth.getUserByEmail(adminEmail);
    console.log("Found Auth User:", user.uid);
    
    const docSnap = await db.collection("profiles").doc(user.uid).get();
    if (docSnap.exists) {
      console.log("Found Firestore Profile:", docSnap.data());
    } else {
      console.log("Firestore Profile NOT FOUND for UID:", user.uid);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkAdmin();
