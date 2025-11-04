import { NextResponse } from "next/server";
import admin from "firebase-admin";

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
  console.error("Firebase admin init error (unread-count):", err);
}

function isAuthorized(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.split(" ")[1];
    if (token === process.env.ADMIN_SECRET) return true;
  }
  return false;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!firebaseInitialized) {
      console.error("unread-count: firebase not initialized");
      return NextResponse.json({ error: "Firebase not configured on server" }, { status: 500 });
    }

    const db = admin.firestore();
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // last 7 days
    const snapshot = await db.collection("admin_notifications")
      .where("seen", "==", false)
      .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(since))
      .get();

    return NextResponse.json({ count: snapshot.size });
  } catch (err: any) {
    console.error("unread-count error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
