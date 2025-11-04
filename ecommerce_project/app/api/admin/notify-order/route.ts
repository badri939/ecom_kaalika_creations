import { NextResponse } from "next/server";
const { initFirebase } = require("../../../lib/firebaseAdmin");
const { admin, db, initialized: firebaseInitialized } = initFirebase();

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
