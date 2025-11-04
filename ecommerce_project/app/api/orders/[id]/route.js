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

export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const { id: orderId } = params;

  try {
    const { admin, db, initialized: firebaseInitialized } = getFirebase();
    if (!db || !firebaseInitialized) {
      return NextResponse.json(
        { error: "Firebase not configured" },
        { status: 500 }
      );
    }
    const firestore = db; // db in this project is actually a firestore instance
    const orderRef = firestore.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderDoc.data();
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}