"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

interface Order {
  id: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  date: string;
  estimatedDelivery: string;
}

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      }
    };

    fetchOrder();
  }, [orderId]);

  if (error) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-6 text-center text-red-600">Error</h1>
        <p className="text-lg text-gray-700">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-600">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-4xl font-bold mb-6 text-center text-green-600">Order Confirmation</h1>
      <p className="text-lg text-gray-700">Thank you for your order!</p>
      <p className="text-lg text-gray-700">Order ID: <span className="font-bold">{order.id}</span></p>

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-gray-800">Order Summary</h2>
        <ul className="list-disc pl-6">
          {order.items.map((item, index) => (
            <li key={index} className="text-lg text-gray-700">
              {item.name} - Quantity: {item.quantity} - ₹{item.price * item.quantity}
            </li>
          ))}
        </ul>
        <p className="text-xl font-bold mt-4">Total: ₹{order.total}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-gray-800">Estimated Delivery</h2>
        <p className="text-lg text-gray-700">Your order will be delivered by <span className="font-bold">{order.estimatedDelivery}</span>.</p>
      </div>

      <button
        onClick={() => router.push("/products")}
        className="mt-6 bg-blue-500 text-white px-6 py-3 rounded text-lg hover:shadow-lg transition-shadow duration-300"
      >
        Continue Shopping
      </button>
    </div>
  );
}