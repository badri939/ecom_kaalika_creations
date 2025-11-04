import { NextResponse } from "next/server";
const { initFirebase } = require("../../../lib/firebaseAdmin");
const { admin, db, initialized: firebaseInitialized } = initFirebase();

export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const { id: orderId } = params;

  try {
    if (!db) {
      return NextResponse.json(
        { error: "Firebase not configured" },
        { status: 500 }
      );
    }
    const orderRef = db.collection("orders").doc(orderId);
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