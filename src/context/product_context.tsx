import { consumoEnStock, TipoMedida } from "@/constants/measures";
import { applyStoredCategories } from "@/services/product-categories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createContext, useContext, useState } from "react";
import { Precio, Producto } from "../types/products";

type ProductContextType = {
  productos: Producto[];
  agregarProducto: (producto: Producto) => Promise<void>;
  obtenerProductos: () => Promise<void>;
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  reponerStock: (
    productoId: string,
    cantidad: number,
    tipo: TipoMedida,
    equivalencia?: number,
    fechaVencimiento?: string,
  ) => Promise<void>;
  eliminarProducto: (productoId: string) => Promise<void>;
  actualizarPrecios: (productoId: string, precios: Precio[]) => Promise<void>;
  retirarLoteVencido: (
    productoId: string,
    loteId: string,
    cantidad: number,
    motivo: string,
  ) => Promise<void>;
};

export const ProductContext = createContext<ProductContextType | undefined>(
  undefined,
);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const router = useRouter();

  //  URL BASE
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  //  FETCH CON AUTH AUTOMÁTICO
  const fetchWithAuth = async (url: string, options: any = {}) => {
    if (!API_URL)
      throw new Error("Falta EXPO_PUBLIC_API_URL en el archivo .env");
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
      const res = await fetchWithAuth(`${API_URL}/api/products`);
      const data = await res.json();

      if (!res.ok) {
        console.log("Error obteniendo productos:", data);
        return;
      }

      setProductos(await applyStoredCategories(data));
    } catch (error) {
      console.log("Error cargando productos:", error);
    }
  };

  //Retirar lote Vencido

  const retirarLoteVencido = async (
    productoId: string,
    loteId: string,
    cantidad: number,
    motivo: string,
  ): Promise<void> => {
    const res = await fetchWithAuth(
      `${API_URL}/api/products/${productoId}/lotes/${loteId}/retirar-vencido`,
      {
        method: "PATCH",
        body: JSON.stringify({ cantidad, motivo }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "No se pudo retirar el lote vencido.");
    }

    setProductos((prev) =>
      prev.map((producto) => (producto._id === productoId ? data : producto)),
    );
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

  const eliminarProducto = async (productoId: string) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/products/${productoId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Error eliminando producto:", data);

        throw new Error(data?.message || "No se pudo eliminar el producto");
      }

      // Eliminarlo también del estado local
      setProductos((prev) =>
        prev.filter((producto) => producto._id !== productoId),
      );
    } catch (error) {
      console.log("Error eliminando producto:", error);
      throw error;
    }
  };

  //Actualizar precio

  const actualizarPrecios = async (productoId: string, precios: Precio[]) => {
    try {
      const preciosLimpios = precios.map((precio) => ({
        tipo: precio.tipo,
        valor: Number(precio.valor),
        ...(precio.equivalencia !== undefined
          ? {
              equivalencia: Number(precio.equivalencia),
            }
          : {}),
      }));

      const res = await fetchWithAuth(
        `${API_URL}/api/products/${productoId}/precios`,
        {
          method: "PATCH",
          body: JSON.stringify({
            precios: preciosLimpios,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        console.log("Error actualizando precios:", data);

        throw new Error(
          data?.message || "No se pudieron actualizar los precios",
        );
      }

      // Actualizar producto local con lo que devolvió MongoDB
      setProductos((prev) =>
        prev.map((producto) => (producto._id === productoId ? data : producto)),
      );
    } catch (error) {
      console.log("Error actualizando precios:", error);
      throw error;
    }
  };

  // REPONER STOCK

  const reponerStock = async (
    productoId: string,
    cantidad: number,
    tipo: TipoMedida,
    equivalencia?: number,
    fechaVencimiento?: string,
  ): Promise<void> => {
    try {
      const producto = productos.find((item) => item._id === productoId);

      if (!producto) {
        throw new Error("No se encontró el producto.");
      }

      if (producto.vence && !fechaVencimiento) {
        throw new Error(
          "Debes indicar la fecha de vencimiento del lote nuevo.",
        );
      }

      const precio = producto.precios?.find((p) => p.tipo === tipo);

      const factor = consumoEnStock(
        tipo,
        equivalencia ?? precio?.equivalencia,
        producto.unidadStock,
      );

      if (!Number.isFinite(factor) || factor <= 0) {
        throw new Error("Presentación incompatible con el stock.");
      }

      const cantidadAgregar = cantidad * factor;

      const body: {
        cantidad: number;
        fechaVencimiento?: string;
      } = {
        cantidad: cantidadAgregar,
      };

      if (producto.vence && fechaVencimiento) {
        body.fechaVencimiento = fechaVencimiento;
      }

      const res = await fetchWithAuth(
        `${API_URL}/api/products/${productoId}/stock`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "No se pudo actualizar el stock.");
      }

      setProductos((prev) =>
        prev.map((p) => (p._id === productoId ? data : p)),
      );
    } catch (error) {
      console.error("Error reponiendo stock:", error);
      throw error;
    }
  };

  return (
    <ProductContext.Provider
      value={{
        productos,
        agregarProducto,
        obtenerProductos,
        setProductos,
        reponerStock,
        eliminarProducto,
        actualizarPrecios,
        retirarLoteVencido,
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
