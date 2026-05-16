const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function syncUsers() {
  try {
    console.log('Fetching users from Firebase Auth...');
    const listUsersResult = await auth.listUsers();
    console.log(`Found ${listUsersResult.users.length} users in Auth.`);

    const batch = db.batch();
    let count = 0;

    for (const userRecord of listUsersResult.users) {
      const profileRef = db.collection('profiles').doc(userRecord.uid);
      const profileDoc = await profileRef.get();

      if (!profileDoc.exists) {
        console.log(`Creating profile for ${userRecord.email || userRecord.uid}...`);
        batch.set(profileRef, {
          email: userRecord.email || '',
          full_name: userRecord.displayName || 'Customer',
          is_admin: false,
          created_at: admin.firestore.Timestamp.fromDate(new Date(userRecord.metadata.creationTime)),
          is_google_user: userRecord.providerData.some(p => p.providerId === 'google.com'),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
      } else {
        // Update if missing critical fields
        const data = profileDoc.data();
        if (!data.email || !data.full_name) {
            console.log(`Updating existing profile for ${userRecord.email || userRecord.uid}...`);
            batch.update(profileRef, {
                email: data.email || userRecord.email || '',
                full_name: data.full_name || userRecord.displayName || 'Customer',
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
            count++;
        }
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`Successfully synced ${count} profiles.`);
    } else {
      console.log('All users already have profiles. No sync needed.');
    }

  } catch (error) {
    console.error('Error syncing users:', error);
  } finally {
    process.exit();
  }
}

syncUsers();
