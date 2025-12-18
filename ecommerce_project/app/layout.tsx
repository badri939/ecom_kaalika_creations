"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider, useCart } from "@/context/CardContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FaShoppingCart, FaHome, FaShoppingBag, FaWhatsapp } from "react-icons/fa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function FloatingActionButtons() {
  const { cart } = useCart();
  const pathname = usePathname();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-4 z-50">
      {/* Home Button - Only show when not on home page */}
      {pathname !== "/" && (
        <Link href="/">
          <button
            className="bg-yellow-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-600 hover:scale-105 transform transition-transform duration-300"
            aria-label="Go to Home"
          >
            <FaHome className="text-xl" />
          </button>
        </Link>
      )}
      {/* View Cart Button with badge */}
      <Link href="/cart">
        <button
          className="relative bg-blue-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 hover:scale-105 transform transition-transform duration-300"
          aria-label="View Cart"
        >
          🛒
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
        </button>
      </Link>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/919964158588?text=Hi%2C%20I%27m%20interested%20in%20your%20products"
        target="_blank"
        rel="noopener noreferrer"
      >
        <button
          className="bg-green-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 hover:scale-105 transform transition-transform duration-300"
          aria-label="Chat on WhatsApp"
        >
          <FaWhatsapp className="text-2xl" />
        </button>
      </a>

      {/* Contact Button */}
      <Link href="/contact">
        <button
          className="bg-indigo-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:scale-105 transform transition-transform duration-300"
          aria-label="Contact Us"
        >
          📞
        </button>
      </Link>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="bg-gray-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-600 hover:scale-105 transform transition-transform duration-300"
        aria-label="Scroll to Top"
      >
        ⬆️
      </button>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <html lang="en">
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <header className="flex justify-between items-center p-4 bg-yellow-300">
              <h1 className="text-2xl font-bold">E-Commerce</h1>
              <nav className="flex items-center gap-4 relative z-50">
                <div className="relative group" tabIndex={0}>
                  <button className="bg-gray-800 text-white py-2 px-4 rounded hover:bg-gray-700 focus:outline-none">
                    Account
                  </button>
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50 transition-all duration-150 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                  >
                    <LogoutButton />
                  </div>
                </div>
              </nav>
            </header>
            <FloatingActionButtons />
            <main>{children}</main>
          </body>
        </html>
      </CartProvider>
    </AuthProvider>
  );
}

function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Logout
    </button>
  );
}

function ClearCartButton() {
  const { clearCart } = useCart();

  return (
    <button
      onClick={clearCart}
      className="bg-red-500 text-white px-4 py-2 rounded mt-2"
    >
      Clear Cart
    </button>
  );
}

// Update CartBadge to prevent hydration mismatch
function CartBadge() {
  const { cart } = useCart();
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    setTotalItems(itemCount);
  }, [cart]);

  return (
    <Link href="/cart">
      <div
        className="fixed top-4 right-4 bg-blue-500 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-all duration-300 z-50"
        aria-label="View Cart"
      >
        <span className="text-sm sm:text-lg font-bold">🛒</span>
        {totalItems > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs sm:text-sm rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </div>
    </Link>
  );
}

// Enhance the CartSummary widget with modern and visually appealing UI elements
function CartSummary() {
  const { cart, clearCart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const pathname = usePathname(); // Get the current route

  return (
    <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <FaShoppingCart size={24} />
        <h2 className="text-xl font-bold">Cart Summary</h2>
      </div>
      <p className="text-sm">Items in Cart: <span className="font-semibold">{totalItems}</span></p>
      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={clearCart}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
        >
          <FaShoppingBag size={16} /> Clear Cart
        </button>
        {pathname !== "/cart" ? (
          <Link href="/cart">
            <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 flex items-center justify-center gap-2">
              <FaShoppingCart size={16} /> View Cart
            </button>
          </Link>
        ) : (
          <>
            <Link href="/products">
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2">
                <FaShoppingBag size={16} /> Continue Shopping
              </button>
            </Link>
            <Link href="/">
              <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2">
                <FaHome size={16} /> Back to Home
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// Ensure the CartDrawer is rendered globally and fix its styling
function CartDrawer() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure this component only renders on the client
  }, []);

  if (!isClient) return null; // Prevent rendering on the server

  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 z-50"
      >
        🛒 {cart.length}
      </button>

      {/* Cart Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
          onClick={() => setIsOpen(false)} // Close drawer on overlay click
        >
          <div
            className="w-1/3 bg-white h-full shadow-lg p-4"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the drawer
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Cart</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✖
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-600">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: ₹{item.price}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div className="mt-4">
                  <h3 className="text-lg font-bold">Total: ₹{totalCost}</h3>
                  <button
                    onClick={clearCart}
                    className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 mt-2"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => alert('Proceeding to checkout...')}
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mt-2"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
