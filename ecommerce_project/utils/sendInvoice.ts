// utils/sendInvoice.ts
// Utility function to send invoice data to backend

export type InvoicePayload = {
  recipient: string;
  subject: string;
  html: string;
  // Optional metadata about the order that admin email can use to build a summary
  orderMetadata?: any;
};

export async function sendInvoice(payload: InvoicePayload): Promise<void> {
  try {
    // Use relative API route so we can run server-side sending (keeps API keys secret)
    const url = `/api/send-invoice`;

    // If Firebase auth is present, include the ID token so the server can verify the caller
    let idToken: string | null = null;
    try {
      // Importing auth lazily to avoid loading Firebase on server-side imports
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { auth } = require("@/firebaseConfig");
      if (auth && auth.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (err) {
      // ignore — token is optional but recommended
      console.warn("sendInvoice: could not read firebase auth token", err);
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorText = await response.text();
      try {
        const json = JSON.parse(errorText);
        errorText = json.message || json.error || errorText;
      } catch {}
      throw new Error(errorText || "Failed to send invoice");
    }

    console.log("Invoice sent successfully");
  } catch (error) {
    console.error("Error sending invoice:", error);
  }
}
