import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Build service account object from env vars (same pattern used elsewhere)
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

// Initialize Firebase Admin SDK when possible
let firebaseInitialized = false;
try {
    if (process.env.FIREBASE_PROJECT_ID && !admin.apps.length) {
    // serviceAccount is built from env vars; cast to any to satisfy TS at runtime
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount as any) });
    firebaseInitialized = true;
  }
} catch (err) {
  console.error("Firebase admin init error:", err);
}

// Small helper to escape HTML to avoid injection in email templates
function escapeHtml(input: string) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  // Ensure SendGrid is configured
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    return NextResponse.json({ error: "SENDGRID_API_KEY not configured" }, { status: 500 });
  }

  // Require authorization token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!firebaseInitialized) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    // Verify user token
    const decoded = await admin.auth().verifyIdToken(token);
    // NOTE: we don't use Firestore here but decoded contains uid/email if needed

    const body = await request.json();
    const { recipient, subject, html, orderMetadata } = body || {};
    if (!recipient || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields (recipient, subject, html)" }, { status: 400 });
    }

    const FROM_EMAIL = process.env.FROM_EMAIL || `no-reply@kaalikacreations.com`;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SENDGRID_ADMIN_EMAIL || null;

    // Prepare SendGrid payload: send separate emails to purchaser and admin (if configured)
    const personalizations: any[] = [];
    personalizations.push({ to: [{ email: recipient }] });
    if (ADMIN_EMAIL) personalizations.push({ to: [{ email: ADMIN_EMAIL }] });

    // Send purchaser email (use the html provided)
    const purchaserPayload = {
      personalizations: [{ to: [{ email: recipient }] }],
      from: { email: FROM_EMAIL, name: "Kaalika Creations" },
      subject,
      content: [{ type: "text/html", value: html }],
    };

    const purchaserRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(purchaserPayload),
    });

    if (!purchaserRes.ok) {
      const text = await purchaserRes.text();
      console.error("SendGrid purchaser error:", text);
      return NextResponse.json({ error: "Failed to send purchaser email", detail: text }, { status: 502 });
    }

    // If ADMIN_EMAIL configured, send a tailored admin notification
    if (ADMIN_EMAIL) {
      // Build a minimal admin HTML with order summary and helpful links
      const ADMIN_CONSOLE_URL = process.env.ADMIN_CONSOLE_URL || `https://your-admin-console.example.com`;

      const orderId = orderMetadata?.orderId || orderMetadata?.id || "N/A";
      const paymentId = orderMetadata?.paymentId || orderMetadata?.payment_id || "N/A";
      const amount = orderMetadata?.total || orderMetadata?.totalCost || "N/A";
      const customerEmail = orderMetadata?.customerEmail || orderMetadata?.email || "N/A";

        const itemsHtml = Array.isArray(orderMetadata?.cart)
          ? orderMetadata.cart
              .map(
                (it: any) => `
                  <tr>
                    <td style="padding:8px;border:1px solid #e6e6e6">${escapeHtml(String(it.name))}</td>
                    <td style="padding:8px;border:1px solid #e6e6e6;text-align:center">${escapeHtml(String(it.quantity))}</td>
                    <td style="padding:8px;border:1px solid #e6e6e6;text-align:right">₹${escapeHtml(String(it.price * it.quantity))}</td>
                  </tr>`
              )
              .join("")
          : `<tr><td colspan="3" style="padding:8px;border:1px solid #e6e6e6">No item details</td></tr>`;

        const adminHtml = `
          <div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#f9fafb;padding:20px">
            <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
              <div style="background:#111827;padding:16px 20px;color:#fff">
                <h1 style="margin:0;font-size:18px">Kaalika Creations — New Order</h1>
              </div>
              <div style="padding:20px">
                <p style="margin:0 0 12px">A new order has been placed. Summary below.</p>

                <table style="width:100%;margin-bottom:12px;border-collapse:collapse">
                  <tr>
                    <td style="padding:8px;border:1px solid #e6e6e6;width:50%"><strong>Order ID</strong></td>
                    <td style="padding:8px;border:1px solid #e6e6e6">${escapeHtml(orderId)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px;border:1px solid #e6e6e6"><strong>Payment ID</strong></td>
                    <td style="padding:8px;border:1px solid #e6e6e6">${escapeHtml(paymentId)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px;border:1px solid #e6e6e6"><strong>Amount</strong></td>
                    <td style="padding:8px;border:1px solid #e6e6e6">₹${escapeHtml(String(amount))}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px;border:1px solid #e6e6e6"><strong>Customer</strong></td>
                    <td style="padding:8px;border:1px solid #e6e6e6">${escapeHtml(customerEmail)}</td>
                  </tr>
                </table>

                <h3 style="margin:12px 0">Items</h3>
                <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
                  <thead>
                    <tr style="background:#f3f4f6">
                      <th style="padding:8px;border:1px solid #e6e6e6;text-align:left">Product</th>
                      <th style="padding:8px;border:1px solid #e6e6e6;text-align:center">Qty</th>
                      <th style="padding:8px;border:1px solid #e6e6e6;text-align:right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <p style="margin:0 0 16px"><strong>Total:</strong> ₹${escapeHtml(String(amount))}</p>

                <p style="margin:0 0 20px">Open in admin: <a href="${ADMIN_CONSOLE_URL.replace(/\/$/, "")}/orders/${orderId}" style="color:#2563eb">${ADMIN_CONSOLE_URL.replace(/\/$/, "")}/orders/${orderId}</a></p>

                <div style="text-align:center">
                  <a href="${ADMIN_CONSOLE_URL.replace(/\/$/, "")}/orders/${orderId}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;border-radius:6px;text-decoration:none">View Order</a>
                </div>
              </div>
              <div style="background:#f9fafb;padding:12px 20px;font-size:12px;color:#6b7280">This is an automated notification from Kaalika Creations.</div>
            </div>
          </div>
        `;

      const adminSubject = `New Order ${orderId} — Kaalika Creations`;

      const adminPayload = {
        personalizations: [{ to: [{ email: ADMIN_EMAIL }] }],
        from: { email: FROM_EMAIL, name: "Kaalika Creations" },
        subject: adminSubject,
        content: [{ type: "text/html", value: adminHtml }],
      };

      const adminRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminPayload),
      });

      if (!adminRes.ok) {
        const text = await adminRes.text();
        console.error("SendGrid admin error:", text);
        // don't fail the whole request if admin email fails; log and continue
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("send-invoice error:", error);
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
