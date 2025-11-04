import { NextResponse } from "next/server";
const { initFirebase } = require("../../../lib/firebaseAdmin");
const { admin, db, initialized: firebaseInitialized } = initFirebase();

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
