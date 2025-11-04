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
  console.error("Firebase admin init error (razorpay-pdf):", err);
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
    if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const invoiceId = url.searchParams.get("invoiceId");
    if (!invoiceId) return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });

    const RZ_KEY = process.env.RAZORPAY_KEY_ID;
    const RZ_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RZ_KEY || !RZ_SECRET) return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });

    const auth = Buffer.from(`${RZ_KEY}:${RZ_SECRET}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/invoices/${invoiceId}/pdf`, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      const txt = await res.text();
      console.error("razorpay-pdf download failed:", txt);
      return NextResponse.json({ error: "Failed to download PDF", detail: txt }, { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="invoice-${invoiceId}.pdf"` },
    });
  } catch (err: any) {
    console.error("razorpay-pdf error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
