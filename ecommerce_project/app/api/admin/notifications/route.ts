import { NextResponse } from "next/server";
const fbMod = require("../../../lib/firebaseAdmin");
function _resolveInit() {
  if (!fbMod) return null;
  if (typeof fbMod.initFirebase === "function") return fbMod.initFirebase;
  if (fbMod.default && typeof fbMod.default.initFirebase === "function") return fbMod.default.initFirebase;
  if (typeof fbMod === "function") return fbMod;
  return null;
}
const _init = _resolveInit();
const { admin, db, initialized: firebaseInitialized } = _init ? _init() : { admin: require("firebase-admin"), db: null, initialized: false };

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

    if (!firebaseInitialized) {
      console.error("notifications: firebase not initialized");
      return NextResponse.json({ error: "Firebase not configured on server" }, { status: 500 });
    }

    const db = admin.firestore();
    const snapshot = await db.collection("admin_notifications").orderBy("createdAt", "desc").limit(50).get();
    const items: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      items.push({ id: doc.id, ...data });
    });

    return NextResponse.json({ notifications: items });
  } catch (err: any) {
    console.error("notifications error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
