"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { use } from "react";

export default function Page({ searchParams }: any) {
  // Unwrap searchParams if it's a Promise (per Next.js App Router guidance)
  const params = typeof searchParams?.then === "function" ? use(searchParams) : searchParams;
  const orderId = params?.orderId as string | undefined;
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-white to-blue-100 px-4 py-10">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center animate-fade-in">
        <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <h1 className="text-3xl font-extrabold text-green-700 mb-2 text-center">Thank You for Your Order!</h1>
        <p className="text-lg text-gray-700 mb-4 text-center">
          Your order has been placed successfully.
          {orderId && <span> <br />Order ID: <span className="font-bold">{orderId}</span></span>}
        </p>
        {user && (
          <div className="mb-4 text-center">
            <p className="text-base text-gray-800">Name: <span className="font-semibold">{user.displayName || "-"}</span></p>
            <p className="text-base text-gray-800">Email: <span className="font-semibold">{user.email || "-"}</span></p>
          </div>
        )}
        <Link href="/products">
          <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 transition-transform duration-200 mb-4">
            Continue Shopping
          </button>
        </Link>
        <Link href="/profile">
          <button className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
            View Order History
          </button>
        </Link>
      </div>
    </div>
  );
}
