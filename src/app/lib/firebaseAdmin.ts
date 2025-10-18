import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json";

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully!");
  }
} catch (err) {
  console.error("🔥 Firebase Admin failed to initialize:", err);
}

export default admin;
