import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// ES module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account JSON
const serviceAccountPath = resolve(__dirname, "serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function addRolesToExistingUsers() {
  const usersSnapshot = await db.collection("users").get();
  console.log(`Found ${usersSnapshot.size} users.`);

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();

    if (!data.role) {
      await db.collection("users").doc(doc.id).update({
        role: "user",
      });
      console.log(`Updated user ${doc.id} with role "user"`);
    }
  }

  console.log("✅ All users updated.");
}

addRolesToExistingUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
