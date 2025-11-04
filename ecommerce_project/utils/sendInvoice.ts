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
  // No-op in manual-invoice mode. Retain function to avoid import errors.
  console.info("sendInvoice: skipped (manual invoice workflow).", { recipient: payload.recipient, orderMetadata: payload.orderMetadata?.orderId || null });
  return;
}
