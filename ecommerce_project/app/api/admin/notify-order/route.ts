import { NextResponse } from "next/server";
const fbMod = require("../../../lib/firebaseAdmin");
function _resolveInit() {
  if (!fbMod) return null;
  if (typeof fbMod.initFirebase === "function") return fbMod.initFirebase;
  if (fbMod.default && typeof fbMod.default.initFirebase === "function") return fbMod.default.initFirebase;
  if (typeof fbMod === "function") return fbMod;
  return null;
}
function getFirebase() {
  const _init = _resolveInit();
  return _init ? _init() : { admin: require("firebase-admin"), db: null, initialized: false };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // body should contain at least orderId and customer info; we'll store the entire payload.
    const payload = body || {};

    const { admin, db, initialized: firebaseInitialized } = getFirebase();
    if (!firebaseInitialized) {
      console.error("notify-order: firebase not initialized");
      return NextResponse.json({ error: "Firebase not configured on server" }, { status: 500 });
    }

    const firestore = admin.firestore();
    const docRef = await firestore.collection("admin_notifications").add({
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
