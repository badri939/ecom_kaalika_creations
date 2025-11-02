import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Build service account object from env vars (same pattern used elsewhere)
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

// Initialize Firebase Admin SDK when possible
let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseInitialized = true;
  }
} catch (err) {
  console.error("Firebase admin init error:", err);
}

export async function POST(request: Request) {
  // Ensure SendGrid is configured
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    return NextResponse.json({ error: "SENDGRID_API_KEY not configured" }, { status: 500 });
  }

  // Require authorization token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!firebaseInitialized) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    // Verify user token
    const decoded = await admin.auth().verifyIdToken(token);
    // NOTE: we don't use Firestore here but decoded contains uid/email if needed

    const body = await request.json();
    const { recipient, subject, html } = body || {};
    if (!recipient || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields (recipient, subject, html)" }, { status: 400 });
    }

    const FROM_EMAIL = process.env.FROM_EMAIL || `no-reply@kaalikacreations.com`;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SENDGRID_ADMIN_EMAIL || null;

    // Prepare SendGrid payload: send separate emails to purchaser and admin (if configured)
    const personalizations: any[] = [];
    personalizations.push({ to: [{ email: recipient }] });
    if (ADMIN_EMAIL) personalizations.push({ to: [{ email: ADMIN_EMAIL }] });

    const payload = {
      personalizations,
      from: { email: FROM_EMAIL, name: "Kaalika Creations" },
      subject,
      content: [{ type: "text/html", value: html }],
    };

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("SendGrid error:", text);
      return NextResponse.json({ error: "Failed to send email", detail: text }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("send-invoice error:", error);
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
