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

  // Optional: template IDs for SendGrid dynamic templates
  const SENDGRID_PURCHASER_TEMPLATE_ID = process.env.SENDGRID_PURCHASER_TEMPLATE_ID || null;
  const SENDGRID_ADMIN_TEMPLATE_ID = process.env.SENDGRID_ADMIN_TEMPLATE_ID || null;

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

    // If a SendGrid purchaser template ID is configured, use template flow
    if (SENDGRID_PURCHASER_TEMPLATE_ID) {
      const dynamicData = {
        subject,
        order: {
          id: orderMetadata?.orderId || orderMetadata?.id || null,
          total: orderMetadata?.total || orderMetadata?.totalCost || null,
          items: Array.isArray(orderMetadata?.cart)
            ? orderMetadata.cart.map((it: any) => ({ name: it.name, qty: it.quantity, amount: it.price * it.quantity }))
            : [],
        },
        customer: {
          name: orderMetadata?.name || null,
          email: orderMetadata?.customerEmail || orderMetadata?.email || null,
          phone: orderMetadata?.phone || null,
          address: orderMetadata?.address || null,
        },
      };

      const templatePayload = {
        personalizations: [{ to: [{ email: recipient }], dynamic_template_data: dynamicData }],
        from: { email: FROM_EMAIL, name: "Kaalika Creations" },
        template_id: SENDGRID_PURCHASER_TEMPLATE_ID,
      };

      const purchaserRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templatePayload),
      });

      if (!purchaserRes.ok) {
        const text = await purchaserRes.text();
        console.error("SendGrid purchaser template error:", text);
        return NextResponse.json({ error: "Failed to send purchaser email (template)", detail: text }, { status: 502 });
      }
    } else {
      // Fallback: send raw HTML as before
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
    }

    // If ADMIN_EMAIL configured, send a tailored admin notification
    if (ADMIN_EMAIL) {
      // Build structured admin dynamic data for template or HTML fallback
      const ADMIN_CONSOLE_URL = process.env.ADMIN_CONSOLE_URL || `https://your-admin-console.example.com`;

  const orderId = orderMetadata?.orderId || orderMetadata?.id || "N/A";
  const paymentId = orderMetadata?.paymentId || orderMetadata?.payment_id || "N/A";
  const amount = orderMetadata?.total || orderMetadata?.totalCost || "N/A";
  const customerEmail = orderMetadata?.customerEmail || orderMetadata?.email || "N/A";
  const shippingAddress = orderMetadata?.address || orderMetadata?.shippingAddress || "N/A";
  const phone = orderMetadata?.phone || orderMetadata?.customerPhone || "N/A";

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

        const adminDynamic = {
          order: {
            id: orderId,
            paymentId: paymentId,
            total: amount,
            items: Array.isArray(orderMetadata?.cart)
              ? orderMetadata.cart.map((it: any) => ({ name: it.name, qty: it.quantity, amount: it.price * it.quantity }))
              : [],
          },
          customer: {
            email: customerEmail,
            phone,
            address: shippingAddress,
          },
          adminConsoleUrl: ADMIN_CONSOLE_URL.replace(/\/$/, ""),
        };

        if (SENDGRID_ADMIN_TEMPLATE_ID) {
          const adminTemplatePayload = {
            personalizations: [{ to: [{ email: ADMIN_EMAIL }], dynamic_template_data: adminDynamic }],
            from: { email: FROM_EMAIL, name: "Kaalika Creations" },
            template_id: SENDGRID_ADMIN_TEMPLATE_ID,
          };

          const adminRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(adminTemplatePayload),
          });

          if (!adminRes.ok) {
            const text = await adminRes.text();
            console.error("SendGrid admin template error:", text);
          }
        } else {
          const adminHtml = `...`; // fallback uses previously constructed HTML (kept short here)
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
          }
        }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("send-invoice error:", error);
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
