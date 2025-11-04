import { NextResponse } from "next/server";

export async function GET() {
  try {
    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || null;
    const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL || null;
    const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY || null;

    const firebaseConfigured = Boolean(firebaseProjectId && firebaseClientEmail && firebasePrivateKey);
    const privateKeyLooksEscaped = typeof firebasePrivateKey === "string" && firebasePrivateKey.includes("\\n");
    const privateKeyLooksPEM = typeof firebasePrivateKey === "string" && firebasePrivateKey.includes("-----BEGIN");

    return NextResponse.json({
      ok: true,
      time: new Date().toISOString(),
      firebase: {
        configured: firebaseConfigured,
        projectId: firebaseProjectId,
        clientEmailPresent: Boolean(firebaseClientEmail),
        privateKeyPresent: Boolean(firebasePrivateKey),
        privateKeyLooksEscaped,
        privateKeyLooksPEM,
      },
      note: "This endpoint only reports presence/format hints for Firebase env vars. It does not attempt to initialize admin SDK.",
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
