// Lightweight centralized Firebase Admin initializer.
// Handles either a full JSON service account in FIREBASE_SERVICE_ACCOUNT
// or individual FIREBASE_* env vars. Does NOT log secrets; only reports presence/shape.
const fs = require("fs");
const path = require("path");
const adminPkg = require("firebase-admin");

// Try to build service account from envs. If FIREBASE_SERVICE_ACCOUNT is present,
// parse that JSON; otherwise use individual FIREBASE_* env vars and normalize "\\n".
function buildServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT present but invalid JSON");
      return null;
    }
  }
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  return {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    // Accept both escaped "\\n" (common in Vercel env UI) and real newlines
    private_key: rawKey ? rawKey.replace(/\\n/g, "\n") : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };
}

// Development fallback: if a local untracked JSON file exists, prefer it.
function buildServiceAccountFromFile() {
  try {
    const candidate = path.join(__dirname, "..", ".firebase_service_account.json");
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    // don't surface secrets or fail the process; log minimal info
    console.error("Failed to read local firebase service account file:", e?.message || e);
  }
  return null;
}

function initFirebase() {
  try {
    if (global.__firebaseAdminInitialized) {
      return { admin: adminPkg, db: adminPkg.firestore(), initialized: true };
    }

    // Prefer explicit env JSON, then local file (dev), then separated envs.
    let serviceAccount = buildServiceAccountFromEnv();
    if (!serviceAccount) serviceAccount = buildServiceAccountFromFile();

    const hasKey = typeof serviceAccount?.private_key === "string" && serviceAccount.private_key.length > 20;
    if (!hasKey) {
      console.error("Firebase init: private_key missing or invalid. FIREBASE_PRIVATE_KEY present?",
        !!process.env.FIREBASE_PRIVATE_KEY, "FIREBASE_SERVICE_ACCOUNT present?", !!process.env.FIREBASE_SERVICE_ACCOUNT,
        "local file present?", !!serviceAccount);
      return { admin: adminPkg, db: null, initialized: false };
    }

    if (!adminPkg.apps.length) {
      adminPkg.initializeApp({ credential: adminPkg.credential.cert(serviceAccount) });
      global.__firebaseAdminInitialized = true;
      console.log("Firebase admin initialized (centralized helper)");
    }
    return { admin: adminPkg, db: adminPkg.firestore(), initialized: true };
  } catch (err) {
    console.error("Firebase initialization failed:", err?.message || err);
    return { admin: adminPkg, db: null, initialized: false };
  }
}

module.exports = { initFirebase };
