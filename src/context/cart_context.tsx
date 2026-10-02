import React, { createContext, useContext, useMemo, useState } from "react";
import { Alert } from "react-native";
import { CartItem } from "../types/products";
import { useProducts } from "./product_context";
import { consumoEnStock } from '@/constants/measures';

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

  const productosPorId = useMemo(() => new Map(productos.map(p => [p._id, p])), [productos]);

  // AGREGAR AL CARRITO

  const agregarAlCarrito = (item: CartItem) => {
    const producto = productosPorId.get(item.productoId);

    if (!producto) {
      Alert.alert(
        "Producto no encontrado",
        "No se pudo encontrar el producto en el inventario.",
      );
      return;
    }

    const stockDisponible = Number(producto.stock) || 0;

    const unidadesNuevoItem = consumoEnStock(item.tipo, item.equivalencia, producto.unidadStock);
    if (!Number.isFinite(unidadesNuevoItem) || unidadesNuevoItem <= 0) {
      Alert.alert('Medida inválida', 'La presentación no coincide con la unidad de inventario del producto.');
      return;
    }

    setCarrito((prev) => {
      // CUÁNTO STOCK YA ESTÁ RESERVADO EN EL CARRITO
      // PARA ESTE PRODUCTO

      const stockEnCarrito = prev.reduce((total, p) =>
        p.productoId === item.productoId
          ? total + p.cantidad * consumoEnStock(p.tipo, p.equivalencia, producto.unidadStock)
          : total, 0);

      // CUÁNTO STOCK CONSUME EL NUEVO ITEM


      const stockDespuesDeAgregar = stockEnCarrito + unidadesNuevoItem;

      // VALIDAR STOCK

      if (stockDespuesDeAgregar > stockDisponible) {
        const disponibleParaCarrito = stockDisponible - stockEnCarrito;

        Alert.alert(
          "Stock insuficiente",
          disponibleParaCarrito > 0
            ? `Quedan ${disponibleParaCarrito} ${producto.unidadStock === 'libra' ? 'lb' : 'unidades'} disponibles de ${producto.nombre}.`
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

  const total = useMemo(() => carrito.reduce((sum, item) => sum + item.total, 0), [carrito]);

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
