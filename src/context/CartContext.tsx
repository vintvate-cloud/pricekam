import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/components/product/ProductCard";

interface CartItem {
  id: string; // This will now be a combination of productId + size
  product: Product;
  quantity: number;
  selectedSize?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (product: Product, selectedSize?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CART_STORAGE_KEY = "joyfulcart_items";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage so cart survives page reloads
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  // Sync to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage quota exceeded — fail silently
    }
  }, [items]);

  const addItem = (product: Product, selectedSize?: string) => {
    setItems((prev) => {
      const cartItemId = selectedSize ? `${product.id}-${selectedSize}` : product.id;
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) return prev.map((i) => i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: cartItemId, product, quantity: 1, selectedSize }];
    });
  };

  const removeItem = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.product.id !== productId));

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(productId);
    setItems((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
