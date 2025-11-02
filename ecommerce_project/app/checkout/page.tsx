"use client";

import { useCart } from "@/context/CardContext";
import { sendInvoice } from "@/utils/sendInvoice";
import { useState } from "react";
import { withAuth } from "@/context/AuthContext";
import { auth } from "@/firebaseConfig";
import { useRouter } from "next/navigation";

// IMPORTANT: Expose checkout API URL and Razorpay key as NEXT_PUBLIC_* env vars for client-side use.
const CHECKOUT_API_URL = process.env.NEXT_PUBLIC_CHECKOUT_API_URL || "https://checkout-service-mdzx.onrender.com";
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_your_key_id";

async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if ((window as any).Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default withAuth(function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const router = useRouter();

  // Assumption: the backend `POST /api/create-order` expects amount in paise (Razorpay standard).
  // If your backend expects rupees, remove the *100 when calling create-order.
  const createRazorpayOrder = async (amountInRupees: number) => {
    const amountInPaise = Math.round(amountInRupees * 100);
    const res = await fetch(`${CHECKOUT_API_URL}/api/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountInPaise, currency: "INR" }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Create order failed: ${txt}`);
    }
    return res.json();
  };

  const verifyPayment = async (payload: any, idToken?: string | null) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
    const res = await fetch(`${CHECKOUT_API_URL}/api/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Verification failed");
    }
    return res.json();
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to place an order.");
        setIsSubmitting(false);
        return;
      }

      const idToken = await user.getIdToken();
      const customerEmail = user.email || "";

      // Map client-side payment values to backend enum values
      const paymentMap: Record<string, string> = {
        "credit-card": "Card",
        card: "Card",
        "debit-card": "Card",
        upi: "UPI",
        gpay: "UPI",
        phonepe: "UPI",
        netbanking: "Net Banking",
        wallet: "Wallet",
        razorpay: "Razorpay",
        paypal: "Paypal",
        cod: "Cash on Delivery",
        "cash-on-delivery": "Cash on Delivery",
      };

      const mappedPaymentMethod = paymentMap[(paymentMethod || "").toString().trim().toLowerCase()] || paymentMethod;

      if (mappedPaymentMethod === "Cash on Delivery") {
        // fallback to server-only flow for COD
        const payload = { cart, totalCost, name, address, paymentMethod: mappedPaymentMethod, customerEmail };
        const result = await verifyPayment(payload, idToken);
        if (result?.redirectUrl) {
          clearCart();
          router.push(result.redirectUrl);
        } else {
          alert("Order placed successfully.");
          clearCart();
          router.push("/order/success");
        }
        return;
      }

      // For online payments we do 3-step Razorpay flow
      setIsProcessingPayment(true);
      // 1) create order on your checkout service
      const order = await createRazorpayOrder(totalCost);

      // 2) load Razorpay script
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Failed to load Razorpay SDK. Please check your connection.");

      // 3) open Razorpay popup
      const options: any = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount || Math.round(totalCost * 100),
        currency: order.currency || "INR",
        name: "Kaalika Creations",
        description: "Order Payment",
        order_id: order.id || order.razorpayOrderId || undefined,
        handler: async function (response: any) {
          try {
            // response contains razorpay_payment_id, razorpay_order_id, razorpay_signature
            const verificationPayload = {
              cart,
              totalCost,
              name,
              address,
              paymentMethod: mappedPaymentMethod,
              customerEmail,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            };
            const verifyResult = await verifyPayment(verificationPayload, idToken);
            // send invoice if available
            if (customerEmail) {
              const invoiceHtml = `
                <h2>Thank you for your purchase!</h2>
                <p>Order ID: ${verifyResult.orderId || verifyResult.id || "N/A"}</p>
                <h3>Order Summary</h3>
                <ul>
                  ${cart.map((item: any) => `<li>${item.name} (x${item.quantity}): ₹${item.price * item.quantity}</li>`).join("")}
                </ul>
                <p><strong>Total: ₹${totalCost}</strong></p>
              `;
              await sendInvoice({ recipient: customerEmail, subject: `Invoice for Order #${verifyResult.orderId || "N/A"}`, html: invoiceHtml });
            }
            clearCart();
            if (verifyResult?.redirectUrl) router.push(verifyResult.redirectUrl);
            else router.push(`/order/success`);
          } catch (err: any) {
            console.error("Payment verification failed:", err);
            alert(err?.message || "Payment verification failed. Please contact support.");
          } finally {
            setIsProcessingPayment(false);
            setIsSubmitting(false);
          }
        },
        prefill: {
          name,
          email: customerEmail,
        },
        notes: {
          address,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            setIsSubmitting(false);
            alert("Payment popup closed. Payment not completed.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(error?.message || "Failed to complete checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-4xl font-bold mb-6 text-center text-black">Checkout</h1>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Order Summary</h2>
        <ul className="space-y-4 mt-4">
          {cart.map((item) => (
            <li key={item.id} className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                <p className="text-sm text-gray-600">Price: ₹{item.price}</p>
              </div>
              <p className="text-lg font-bold">₹{item.price * item.quantity}</p>
            </li>
          ))}
        </ul>
        <h3 className="text-xl font-bold mt-4">Total: ₹{totalCost}</h3>
      </div>

      <form onSubmit={handleCheckout} className="space-y-4">
        <div>
          <label className="block text-base font-medium text-gray-900">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 text-base"
          />
        </div>
        <div>
          <label className="block text-base font-medium text-gray-900">Address</label>
          <textarea
            required
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 text-base"
          ></textarea>
        </div>
        <div>
          <label className="block text-base font-medium text-gray-900">Payment Method</label>
          <select
            required
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 text-base"
          >
            <option value="credit-card">Credit / Debit Card</option>
            <option value="upi">UPI (GPay, PhonePe)</option>
            <option value="netbanking">Net Banking</option>
            <option value="wallet">Wallet</option>
            <option value="razorpay">Razorpay Wallet</option>
            <option value="paypal">PayPal</option>
            <option value="cod">Cash on Delivery</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600 disabled:opacity-60 text-base"
          disabled={isSubmitting || isProcessingPayment}
        >
          {isSubmitting || isProcessingPayment ? "Processing Payment..." : "Place Order"}
        </button>
      </form>
    </div>
  );
});