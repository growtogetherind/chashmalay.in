import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBv9Lm2xw_0jvBNWvOdFUx8PQxkg7soSec",
  authDomain: "chashmalay.firebaseapp.com",
  projectId: "chashmalay",
  storageBucket: "chashmalay.firebasestorage.app",
  messagingSenderId: "1048138384235",
  appId: "1:1048138384235:web:05acdaaa982d4e790e022e",
  measurementId: "G-RR5CTN9G54"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const collectionsToPurge = ["products", "orders", "order_items", "prescriptions", "reviews"];

async function run() {
  console.log("Starting deletion...");
  for (const colName of collectionsToPurge) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Found ${snap.size} documents in '${colName}'`);
      let count = 0;
      for (const docSnap of snap.docs) {
        try {
          await deleteDoc(docSnap.ref);
          count++;
        } catch (delErr) {
          console.error(`  Error deleting doc ${docSnap.id} in ${colName}:`, delErr.message);
        }
      }
      console.log(`Deleted ${count}/${snap.size} from '${colName}'`);
    } catch (err) {
      console.error(`Error querying '${colName}':`, err.message);
    }
  }
  process.exit(0);
}

run();
