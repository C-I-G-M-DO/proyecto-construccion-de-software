import React, { createContext, useContext, useState } from "react";
import { Alert } from "react-native";
import { CartItem } from "../types/products";
import { useProducts } from "./product_context";

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

  const { productos } = useProducts();

  // CALCULAR CUÁNTAS UNIDADES FÍSICAS USA UN ITEM

  const unidadesQueConsume = (item: CartItem) => {
    if (item.tipo === "paquete") {
      return Number(item.equivalencia) || 1;
    }

    return 1;
  };

  // AGREGAR AL CARRITO

  const agregarAlCarrito = (item: CartItem) => {
    const producto = productos.find((p) => p._id === item.productoId);

    if (!producto) {
      Alert.alert(
        "Producto no encontrado",
        "No se pudo encontrar el producto en el inventario.",
      );
      return;
    }

    const stockDisponible = Number(producto.stock) || 0;

    setCarrito((prev) => {
      // CUÁNTO STOCK YA ESTÁ RESERVADO EN EL CARRITO
      // PARA ESTE PRODUCTO

      const stockEnCarrito = prev
        .filter((p) => p.productoId === item.productoId)
        .reduce((total, p) => total + p.cantidad * unidadesQueConsume(p), 0);

      // CUÁNTO STOCK CONSUME EL NUEVO ITEM

      const unidadesNuevoItem = unidadesQueConsume(item);

      const stockDespuesDeAgregar = stockEnCarrito + unidadesNuevoItem;

      // VALIDAR STOCK

      if (stockDespuesDeAgregar > stockDisponible) {
        const disponibleParaCarrito = stockDisponible - stockEnCarrito;

        Alert.alert(
          "Stock insuficiente",
          disponibleParaCarrito > 0
            ? `Solo puedes agregar ${disponibleParaCarrito} unidad${
                disponibleParaCarrito === 1 ? "" : "es"
              } más de ${producto.nombre}.`
            : `Ya tienes todo el stock disponible de ${producto.nombre} en el carrito.`,
        );

        return prev;
      }

      // VER SI YA EXISTE ESA PRESENTACIÓN

      const existe = prev.find((p) => p.id === item.id);

      if (existe) {
        const nuevaCantidad = existe.cantidad + 1;

        return prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                cantidad: nuevaCantidad,
                total: nuevaCantidad * p.precio,
              }
            : p,
        );
      }

      // AGREGAR NUEVA PRESENTACIÓN

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

  // DISMINUIR DEL CARRITO

  const disminuirDelCarrito = (item: CartItem) => {
    setCarrito(
      (prev) =>
        prev
          .map((p) => {
            if (p.id === item.id) {
              const nuevaCantidad = p.cantidad - 1;

              if (nuevaCantidad <= 0) {
                return null;
              }

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

  // =====================================================
  // ELIMINAR ITEM COMPLETO
  // =====================================================

  const eliminarDelCarrito = (id: string) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  // =====================================================
  // VACIAR CARRITO
  // =====================================================

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  // =====================================================
  // TOTAL
  // =====================================================

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
