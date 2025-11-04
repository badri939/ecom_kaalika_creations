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
  console.error("Firebase admin init error (razorpay-issue):", err);
}

function isAuthorized(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.split(" ")[1];
    if (token === process.env.ADMIN_SECRET) return true;
  }
  return false;
}

async function fetchNotification(notificationId: string) {
  if (!firebaseInitialized) throw new Error("Firebase not initialized");
  const db = admin.firestore();
  const doc = await db.collection("admin_notifications").doc(notificationId).get();
  if (!doc.exists) throw new Error("Notification not found");
  return { id: doc.id, ...doc.data() } as any;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { notificationId, order } = body || {};
    let orderData = order || null;

    if (notificationId) {
      const note = await fetchNotification(notificationId);
      orderData = note.payload || orderData;
    }

    if (!orderData) return NextResponse.json({ error: "Missing order data or notificationId" }, { status: 400 });

    const RZ_KEY = process.env.RAZORPAY_KEY_ID;
    const RZ_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RZ_KEY || !RZ_SECRET) return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });

    // Build invoice payload from orderData
    const customer = {
      name: orderData.name || orderData.customerName || "Customer",
      email: orderData.customerEmail || orderData.email || "",
      contact: orderData.phone || orderData.customerPhone || "",
    };

    const line_items = Array.isArray(orderData.cart)
      ? orderData.cart.map((it: any) => ({ name: it.name, amount: Math.round((it.price || 0) * (it.quantity || 1)), quantity: it.quantity || 1 }))
      : [{ name: "Order", amount: Math.round(orderData.totalCost || orderData.total || 0), quantity: 1 }];

    const payload = {
      type: "invoice",
      description: `Order invoice`,
      customer,
      line_items,
      date: Math.floor(Date.now() / 1000),
      due_date: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // due in 7 days
      currency: "INR",
      notes: { orderId: orderData.orderId || orderData.id || null },
    };

    const auth = Buffer.from(`${RZ_KEY}:${RZ_SECRET}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/invoices", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error("Razorpay create invoice failed:", json);
      return NextResponse.json({ error: "Razorpay create failed", detail: json }, { status: 502 });
    }

    // mark notification seen if provided
    if (notificationId && firebaseInitialized) {
      const db = admin.firestore();
      await db.collection("admin_notifications").doc(notificationId).update({ seen: true, invoice: { id: json.id, short_url: json.short_url } });
    }

    return NextResponse.json({ success: true, invoice: { id: json.id, short_url: json.short_url, invoice_pdf: `/api/admin/razorpay-pdf?invoiceId=${json.id}` } });
  } catch (err: any) {
    console.error("razorpay-issue error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
