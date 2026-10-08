import { useEffect, useState } from "react";

// Cada usuario tiene su propio carrito guardado: cart_1, cart_2, etc.
const storageKey = (userId) => `cart_${userId ?? "guest"}`;

const loadCart = (userId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export default function useCart(userId) {
  // Al iniciar, carga el carrito guardado de ese usuario
  const [items, setItems] = useState(() => loadCart(userId));

  // Cada vez que el carrito cambia, se guarda
  useEffect(() => {
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  }, [items, userId]);

  const addItem = (product) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);

      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(Number(quantity) || 1, item.stock)) }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const count = items.reduce((acc, item) => acc + item.quantity, 0);

  return { items, count, addItem, updateQuantity, removeItem, clearCart };
}