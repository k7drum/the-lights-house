import admin from "firebase-admin";

// ✅ Initialize Firebase Admin (Ensure you have the correct credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export const messaging = admin.messaging();
export const dbAdmin = admin.firestore();
export default admin;
