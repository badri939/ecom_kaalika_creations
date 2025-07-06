import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Use environment variables for service account credentials
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

export async function GET(request) {
  if (!db) {
    return NextResponse.json(
      { error: "Firebase not configured" },
      { status: 500 }
    );
  }
  
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Fetch user data from Firestore
    const userRef = db.collection("users").doc(decodedToken.uid);
    const userDoc = await userRef.get();

    let userData;

    if (userDoc.exists) {
      // User exists in Firestore
      userData = userDoc.data();
      // Patch missing name/email from Auth if needed
      let needsUpdate = false;
      let updatedFields = {};
      if (!userData.name || userData.name === "Unknown User") {
        updatedFields.name = decodedToken.name || decodedToken.email?.split("@")[0] || "Unknown User";
        needsUpdate = true;
      }
      if (!userData.email) {
        updatedFields.email = decodedToken.email;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await userRef.set(updatedFields, { merge: true });
        userData = { ...userData, ...updatedFields };
      }
    } else {
      // User does not exist, create a new record
      userData = {
        name: decodedToken.name || decodedToken.email?.split("@")[0] || "Unknown User",
        email: decodedToken.email,
        orderHistory: [],
        invoices: [],
      };
      await userRef.set(userData);
    }

    // Fetch order history and invoices dynamically
    const orderHistory = userData.orderHistory || [];
    const invoices = userData.invoices || [];

    return NextResponse.json({
      name: userData.name,
      email: userData.email,
      orderHistory,
      invoices,
    });
  } catch (error) {
    console.error("Token verification failed or Firestore error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request) {
  if (!db) {
    return NextResponse.json(
      { error: "Firebase not configured" },
      { status: 500 }
    );
  }
  
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { name, email } = await request.json();
    const userRef = db.collection("users").doc(decodedToken.uid);
    await userRef.set({ name, email }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}