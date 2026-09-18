import React, { createContext, useContext, useState } from "react";
import { CartItem } from "../types/products";

type CartContextType = {
  carrito: CartItem[];
  total: number;
  agregarAlCarrito: (item: CartItem) => void;
  disminuirDelCarrito: (item: CartItem) => void;
  eliminarDelCarrito: (id: string) => void;
  vaciarCarrito: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  //  agregar
  const agregarAlCarrito = (item: CartItem) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === item.id);

      if (existe) {
        return prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                cantidad: p.cantidad + 1,
                total: (p.cantidad + 1) * p.precio,
              }
            : p,
        );
      }

      return [
        ...prev,
        {
          ...item,
          cantidad: 1,
          total: item.precio,
        },
      ];
    });
  };

  //  disminuir
  const disminuirDelCarrito = (item: CartItem) => {
    setCarrito(
      (prev) =>
        prev
          .map((p) => {
            if (p.id === item.id) {
              const nuevaCantidad = p.cantidad - 1;

              if (nuevaCantidad <= 0) return null;

              return {
                ...p,
                cantidad: nuevaCantidad,
                total: nuevaCantidad * p.precio,
              };
            }

            return p;
          })
          .filter(Boolean) as CartItem[],
    );
  };

  //  eliminar item completo
  const eliminarDelCarrito = (id: string) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  //  vaciar carrito
  const vaciarCarrito = () => {
    setCarrito([]);
  };

  const total = carrito.reduce((sum, item) => sum + item.total, 0);

  return (
    <CartContext.Provider
      value={{
        carrito,
        total,
        agregarAlCarrito,
        disminuirDelCarrito,
        eliminarDelCarrito,
        vaciarCarrito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
};
