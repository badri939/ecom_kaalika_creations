// utils/sendInvoice.ts
// Utility function to send invoice data to backend

export type InvoicePayload = {
  recipient: string;
  subject: string;
  html: string;
};

export async function sendInvoice(payload: InvoicePayload): Promise<void> {
  try {
  const response = await fetch("http://localhost:4000/api/send-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send invoice");
    }

    // Success
    console.log("Invoice sent successfully");
  } catch (error) {
    // Error handling
    console.error("Error sending invoice:", error);
  }
}
