"use client";

import { useCart } from "@/context/CardContext";
import { withAuth } from "@/context/AuthContext";
import Link from "next/link";

// Update the cart page to display the cart summary with quantity management
export default withAuth(function CartPage() {
  const { cart, removeFromCart, clearCart, updateCartItemQuantity } = useCart();

  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">Your Shopping Cart</h1>

      {cart.length === 0 ? (
        <p className="text-lg text-center text-gray-700">Your cart is empty. Start shopping now!</p>
      ) : (
        <div>
          <ul className="space-y-6">
            {cart.map((item) => (
              <li key={item.id} className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{item.name}</h2>
                    <p className="text-sm text-gray-600">Price: ₹{item.price}</p>
                    <p className="text-sm text-gray-800 font-bold">Total: ₹{item.price * item.quantity}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          if (item.quantity === 1) {
                            removeFromCart(item.id); // Remove the item if quantity is 1
                          } else {
                            updateCartItemQuantity(item.id, item.quantity - 1); // Decrease quantity otherwise
                          }
                        }}
                        className="bg-gray-300 text-gray-800 px-2 py-1 rounded hover:bg-gray-400"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        className="bg-gray-300 text-gray-800 px-2 py-1 rounded hover:bg-gray-400"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Combine the buttons into a single row for a minimalistic design */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Total Cost: ₹{totalCost}</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 hover:scale-105 transform transition-transform duration-300 shadow-md"
            >
              🗑️ <span>Clear Cart</span>
            </button>
          )}
          {cart.length > 0 && (
            <button
              onClick={() => window.location.href = '/checkout'}
              className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 hover:scale-105 transform transition-transform duration-300 shadow-md"
            >
              💳 <span>Proceed to Checkout</span>
            </button>
          )}
          <Link href="/products">
            <button className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 hover:scale-105 transform transition-transform duration-300 shadow-md">
              🛍️ <span>Continue Shopping</span>
            </button>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 hover:scale-105 transform transition-transform duration-300 shadow-md">
              🏠 <span>Back to Home</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
});