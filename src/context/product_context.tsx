import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createContext, useContext, useState } from "react";
import { Producto } from "../types/products";

type ProductContextType = {
  productos: Producto[];
  agregarProducto: (producto: Producto) => Promise<void>;
  obtenerProductos: () => Promise<void>;
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  reponerStock: (
    productoId: string,
    cantidad: number,
    tipo: "unidad" | "libra" | "paquete",
    equivalencia?: number,
  ) => void;
};

export const ProductContext = createContext<ProductContextType | undefined>(
  undefined,
);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const router = useRouter();

  //  URL BASE
  const API_URL = "http://192.168.100.116:3000/api";

  //  FETCH CON AUTH AUTOMÁTICO
  const fetchWithAuth = async (url: string, options: any = {}) => {
    const token = await AsyncStorage.getItem("token");

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    //  TOKEN EXPIRADO → LOGOUT
    if (res.status === 401) {
      console.log("Token inválido → cerrando sesión");

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("nombreColmado");

      router.replace("/login");

      throw new Error("Unauthorized");
    }

    return res;
  };

  //  OBTENER PRODUCTOS
  const obtenerProductos = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/products`);
      const data = await res.json();

      if (!res.ok) {
        console.log("Error obteniendo productos:", data);
        return;
      }

      setProductos(data);
    } catch (error) {
      console.log("Error cargando productos:", error);
    }
  };

  //  AGREGAR PRODUCTO
  const agregarProducto = async (producto: Producto) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/products`, {
        method: "POST",
        body: JSON.stringify(producto),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Error creando producto:", data);
        return;
      }

      //  agregar directamente lo que devuelve Mongo
      setProductos((prev) => [...prev, data]);
    } catch (error) {
      console.log("Error agregando producto:", error);
    }
  };

  //  REPONER STOCK (LOCAL)
  const reponerStock = (
    productoId: string,
    cantidad: number,
    tipo: "unidad" | "libra" | "paquete",
    equivalencia?: number,
  ) => {
    setProductos((prev) =>
      prev.map((producto) => {
        if (producto._id !== productoId) return producto;

        let nuevoStock = producto.stock;

        if (tipo === "unidad") {
          nuevoStock += cantidad;
        }

        if (tipo === "paquete") {
          const precioPaquete = producto.precios?.find(
            (p) => p.tipo === "paquete",
          );

          const eq = equivalencia ?? precioPaquete?.equivalencia ?? 1;

          nuevoStock += cantidad * eq;
        }

        if (tipo === "libra") {
          nuevoStock += cantidad;
        }

        return {
          ...producto,
          stock: nuevoStock,
        };
      }),
    );
  };

  return (
    <ProductContext.Provider
      value={{
        productos,
        agregarProducto,
        obtenerProductos,
        setProductos,
        reponerStock,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

// HOOK
export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error("useProducts debe usarse dentro de ProductProvider");
  }

  return context;
}
