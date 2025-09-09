"use client";

import { useCart } from "@/context/CardContext";
import { sendInvoice } from "@/utils/sendInvoice";
import { useState } from "react";
import { withAuth } from "@/context/AuthContext";
import { auth } from "@/firebaseConfig";
import { useRouter } from "next/navigation";

export default withAuth(function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const router = useRouter();

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

      const token = await user.getIdToken();

      const response = await fetch("http://localhost:4000/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cart,
          totalCost,
          name,
          address,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to place order.");
      }

      const data = await response.json();
      if (data?.redirectUrl) {
        // Generate a simple invoice HTML
        const invoiceHtml = `
          <h2>Thank you for your purchase!</h2>
          <p>Order ID: ${data.orderId || "N/A"}</p>
          <h3>Order Summary</h3>
          <ul>
            ${cart.map(item => `<li>${item.name} (x${item.quantity}): ₹${item.price * item.quantity}</li>`).join("")}
          </ul>
          <p><strong>Total: ₹${totalCost}</strong></p>
        `;
        // Only send invoice if user email exists
        if (user.email) {
          await sendInvoice({
            recipient: user.email,
            subject: `Your Invoice for Order #${data.orderId || "N/A"}`,
            html: invoiceHtml,
          });
        } else {
          console.warn("No user email found, invoice not sent.");
        }
        clearCart();
        router.push(data.redirectUrl);
      } else {
        throw new Error("No redirect URL returned.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
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
            <option value="credit-card">Credit Card</option>
            <option value="paypal">PayPal</option>
            <option value="cod">Cash on Delivery</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600 disabled:opacity-60 text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
});