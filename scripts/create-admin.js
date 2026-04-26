import { admin, db, auth } from "./admin.js";

const adminEmail = "admin@gmail.com";
const adminPassword = "password123"; // Firebase requires min 6 characters

async function createAdmin() {
  console.log("Creating admin user...");
  try {
    let user;
    try {
      user = await auth.getUserByEmail(adminEmail);
      console.log("User already exists, updating profile...");
    } catch (e) {
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
    console.log(`Login details:`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
