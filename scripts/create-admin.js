import { db, auth } from "./admin.js";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

async function createAdmin() {
  if (!adminEmail || !adminPassword) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.");
    process.exit(1);
  }

  console.log("Creating admin user...");
  try {
    let user;
    try {
      user = await auth.getUserByEmail(adminEmail);
      console.log("User already exists, updating profile...");
    } catch {
      user = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: "System Admin"
      });
      console.log(`Successfully created new user: ${user.uid}`);
    }

    await db.collection("profiles").doc(user.uid).set({
      email: adminEmail,
      full_name: "System Admin",
      is_admin: true,
      updated_at: new Date()
    }, { merge: true });

    console.log("Admin privileges granted successfully!");
    console.log(`Email: ${adminEmail}`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
