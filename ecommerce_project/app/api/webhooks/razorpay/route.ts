import { NextResponse } from "next/server";
import admin from "firebase-admin";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

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

let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount as any) });
    firebaseInitialized = true;
  }
} catch (err) {
  console.error("Firebase admin init error (razorpay-webhook):", err);
}

const TEST_WRITE_FS = (process.env.WEBHOOK_TEST_WRITE_FS === "true") || process.env.NODE_ENV === "development";
const TEST_WRITE_DIR = path.join(process.cwd(), "tmp", "razorpay_webhooks");

async function writeTestFile(invoiceId: string | null, event: string, data: any) {
  try {
    await fs.mkdir(TEST_WRITE_DIR, { recursive: true });
    const now = Date.now();
    const fname = invoiceId ? `webhook-${invoiceId}-${now}.json` : `webhook-${now}.json`;
    const full = path.join(TEST_WRITE_DIR, fname);
    await fs.writeFile(full, JSON.stringify({ event, invoiceId, data, ts: new Date().toISOString() }, null, 2), "utf8");
    console.log("Wrote webhook test file:", full);
  } catch (err) {
    console.error("Failed to write webhook test file:", err);
  }
}

function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  try {
    const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (hmac === signature) return true;
    const b64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
    if (b64 === signature) return true;
  } catch (err) {
    console.error("signature verify error", err);
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Razorpay webhook secret not configured");
      // still accept for local test-mode if enabled
      if (!TEST_WRITE_FS) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (webhookSecret && !verifySignature(raw, signature, webhookSecret)) {
      console.warn("Razorpay webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(raw);
    const event = body.event;
    const payload = body.payload || {};

    // We'll primarily handle invoice events
    if (event && event.startsWith("invoice.")) {
      const inv = payload.invoice ? payload.invoice.entity : payload.entity || null;
      const invoiceId = inv?.id || inv?.invoice_id || null;

      if (!invoiceId) {
        console.warn("webhook invoice event missing id", event, body);
        if (TEST_WRITE_FS) await writeTestFile(null, event, body);
        return NextResponse.json({ ok: true });
      }

      const now = admin.firestore ? admin.firestore.FieldValue.serverTimestamp() : null;

      if (!firebaseInitialized) {
        console.error("Firebase not initialized; will write test file instead of Firestore");
        if (TEST_WRITE_FS) {
          await writeTestFile(invoiceId, event, { inv, body });
        }
        return NextResponse.json({ ok: true });
      }

      const db = admin.firestore();

      // find any admin_notifications that reference this invoice
      try {
        const q = db.collection("admin_notifications").where("invoice.id", "==", invoiceId);
        const snaps = await q.get();

        if (!snaps.empty) {
          const promises: Promise<any>[] = [];
          snaps.forEach((doc) => {
            const data: any = { invoice: inv };
            if (event === "invoice.paid") {
              data.paid = true;
              data.paidAt = now;
              data.seen = true;
            }
            if (event === "invoice.issued") {
              data.issuedAt = now;
            }
            promises.push(doc.ref.update(data));
          });
          await Promise.all(promises);
        } else {
          // If no notification exists, create a record so owner can see it
          await db.collection("admin_notifications").add({
            payload: { invoiceEvent: event, invoice: inv },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            seen: event === "invoice.paid",
            invoice: inv,
          });
        }
      } catch (err) {
        console.error("Firestore update error for webhook:", err);
        // Fallback: write test file so developer can inspect
        if (TEST_WRITE_FS) await writeTestFile(invoiceId, event, { err: String(err), inv, body });
      }
      // If invoice was paid, attempt to update Strapi order status if orderId is available in notes
      try {
        const strapiUrl = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
        const strapiToken = process.env.STRAPI_API_TOKEN || process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || process.env.STRAPI_TOKEN;
        const orderIdFromNotes = inv?.notes?.orderId || inv?.notes?.order_id || inv?.notes?.order || null;
        if (event === "invoice.paid" && orderIdFromNotes && strapiUrl) {
          const patchUrl = `${strapiUrl.replace(/\/$/, "")}/api/orders/${encodeURIComponent(orderIdFromNotes)}`;
          const bodyToSend: any = { data: { paymentStatus: "paid", invoiceId: invoiceId } };
          // include raw invoice object in notes if useful
          try {
            const headers: any = { "Content-Type": "application/json" };
            if (strapiToken) headers["Authorization"] = `Bearer ${strapiToken}`;
            const resp = await fetch(patchUrl, { method: "PUT", headers, body: JSON.stringify(bodyToSend) });
            if (!resp.ok) {
              const txt = await resp.text();
              console.warn("Strapi update returned non-OK:", resp.status, txt);
              if (TEST_WRITE_FS) await writeTestFile(invoiceId, "strapi-update-failed", { status: resp.status, text: txt });
            } else {
              const j = await resp.json();
              console.log("Strapi order updated", j);
            }
          } catch (err) {
            console.error("Failed to update Strapi order:", err);
            if (TEST_WRITE_FS) await writeTestFile(invoiceId, "strapi-update-exception", { err: String(err) });
          }
        }
      } catch (err) {
        console.error("Strapi update logic error:", err);
      }
    }

    // Return 200 quickly
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("razorpay webhook handler error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
