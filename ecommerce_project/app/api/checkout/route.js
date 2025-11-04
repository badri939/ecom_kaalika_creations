import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Use environment variables for service account credentials
// Set these in your Vercel dashboard (Settings > Environment Variables)
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

// Initialize Firebase Admin SDK only if credentials are available
let db = null;
if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = getFirestore();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export async function POST(request) {
  try {
    console.log("/api/checkout POST handler invoked at", new Date().toISOString());
    if (!db) {
      console.error("/api/checkout: Firebase not configured (db is null)");
      return NextResponse.json(
        { error: "Firebase not configured" },
        { status: 500 }
      );
    }
    const { cart, totalCost } = await request.json();
    const authHeader = request.headers.get("authorization");

    console.log("/api/checkout: payload parsed", { cartLength: cart?.length ?? 0, totalCost });
    console.log("/api/checkout: auth header present?", Boolean(authHeader));

    console.log("Incoming request payload:", { cart, totalCost });
    console.log("Authorization header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    try {
      console.log("/api/checkout: verifying id token...");
      const start = Date.now();
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log("/api/checkout: verifyIdToken succeeded in", Date.now() - start, "ms");

      // continue using decodedToken below
      
      const order = {
        id: Date.now(),
        items: cart,
        total: totalCost,
        date: new Date().toISOString(),
      };

      const userRef = db.collection("users").doc(decodedToken.uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        await userRef.set({
          orderHistory: [],
          invoices: [],
        });
      }
      await userRef.update({
        orderHistory: admin.firestore.FieldValue.arrayUnion(order),
        invoices: admin.firestore.FieldValue.arrayUnion({
          id: order.id,
          date: order.date,
          total: order.total,
        }),
      });

      const orderRef = db.collection("orders").doc(order.id.toString());
      await orderRef.set(order);

      // Respond with order confirmation and redirect URL
      return NextResponse.json({
        success: true,
        orderId: order.id,
        redirectUrl: `/order/success?orderId=${order.id}`,
      });
    } catch (verifyErr) {
      console.error("/api/checkout: token verification failed:", verifyErr);
      return NextResponse.json({ error: "Unauthorized - invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json({ error: "Failed to process checkout." }, { status: 500 });
  }
}