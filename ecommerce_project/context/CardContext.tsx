"use client"; // Required for Next.js App Router
import { createContext, useContext, useEffect, useState } from "react";

// Define cart item structure
interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string; // Optional size field for products with size variants
}

// Define context data type
interface CartContextType {
  cart: CartItem[];
  cartItems: CartItem[]; // New property to expose cart items
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number, size?: string) => void;
  clearCart: () => void;
  updateCartItemQuantity: (id: number, quantity: number, size?: string) => void; // New function
}

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    console.log("Initial cart in localStorage:", storedCart);
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Function to add an item to the cart
  const addToCart = (item: CartItem) => {
    console.log("addToCart called with item:", item);
    if (!item || !item.id) {
      console.error("Invalid item passed to addToCart:", item);
      return;
    }
    setCart((prevCart) => {
      // For items with sizes, treat each size as a separate cart item
      const existingItem = prevCart.find((cartItem) => 
        cartItem.id === item.id && cartItem.size === item.size
      );
      if (existingItem) {
        console.log("Item already in cart, updating quantity:", existingItem);
        return prevCart.map((cartItem) =>
          cartItem.id === item.id && cartItem.size === item.size
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      } else {
        console.log("Adding new item to cart:", item);
        return [...prevCart, { ...item }];
      }
    });
  };

  // Function to remove an item from the cart
  const removeFromCart = (id: number, size?: string) => {
    setCart((prevCart) => prevCart.filter((item) => {
      // If size is provided, match both id and size; otherwise just match id
      if (size !== undefined) {
        return !(item.id === id && item.size === size);
      }
      return item.id !== id;
    }));
  };

  // Function to clear the entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Function to update the quantity of an item in the cart
  const updateCartItemQuantity = (id: number, quantity: number, size?: string) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        // Remove item if quantity is 0
        return prevCart.filter((item) => {
          if (size !== undefined) {
            return !(item.id === id && item.size === size);
          }
          return item.id !== id;
        });
      }
      return prevCart.map((item) => {
        // If size is provided, match both id and size; otherwise just match id
        const matches = size !== undefined 
          ? (item.id === id && item.size === size)
          : (item.id === id);
        return matches ? { ...item, quantity } : item;
      });
    });
  };

  return (
    <CartContext.Provider
      value={{ cart, cartItems: cart, addToCart, removeFromCart, clearCart, updateCartItemQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
