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
    if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const invoiceId = url.searchParams.get("invoiceId");
    if (!invoiceId) return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });

    const RZ_KEY = process.env.RAZORPAY_KEY_ID;
    const RZ_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RZ_KEY || !RZ_SECRET) return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });

    const auth = Buffer.from(`${RZ_KEY}:${RZ_SECRET}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/invoices/${invoiceId}/pdf`, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      const txt = await res.text();
      console.error("razorpay-pdf download failed:", txt);
      return NextResponse.json({ error: "Failed to download PDF", detail: txt }, { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="invoice-${invoiceId}.pdf"` },
    });
  } catch (err: any) {
    console.error("razorpay-pdf error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
