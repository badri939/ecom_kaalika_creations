import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Firebase Admin if possible
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount as any) });
    firebaseInitialized = true;
  }
} catch (err) {
  console.error("Firebase admin init error (notify-order):", err);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // body should contain at least orderId and customer info; we'll store the entire payload.
    const payload = body || {};

    if (!firebaseInitialized) {
      console.error("notify-order: firebase not initialized");
      return NextResponse.json({ error: "Firebase not configured on server" }, { status: 500 });
    }

    const db = admin.firestore();
    const docRef = await db.collection("admin_notifications").add({
      payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      seen: false,
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err: any) {
    console.error("notify-order error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
