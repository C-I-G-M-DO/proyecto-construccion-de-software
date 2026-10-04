import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CartItem } from "@/types/products";

import type {
  DespacharOrdenPayload,
  DespachoResponse,
  Orden,
} from "@/types/orders";

const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/*$/, "");

async function ordersRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!base) {
    throw new Error("Falta configurar EXPO_PUBLIC_API_URL.");
  }

  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("Inicia sesión para consultar despacho.");
  }

  const response = await fetch(`${base}/api/orders${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 404 || response.status === 501) {
      throw new Error(
        "El backend aún no tiene habilitado el módulo de órdenes.",
      );
    }

    throw new Error(
      data?.message ||
        `No se pudo consultar despacho (HTTP ${response.status}).`,
    );
  }

  return data as T;
}

export async function crearOrden(
  items: CartItem[],
  clientRequestId: string,
  clienteId?: string | null,
  puntosCanjeados: number = 0,
): Promise<Orden> {
  const data = await ordersRequest<Orden>("", {
    method: "POST",

    body: JSON.stringify({
      clientRequestId,

      items: items.map(({ productoId, tipo, cantidad }) => ({
        productoId,
        tipo,
        cantidad,
      })),

      clienteId: clienteId || null,

      puntosCanjeados: Number(puntosCanjeados) || 0,
    }),
  });

  if (
    !data ||
    typeof data._id !== "string" ||
    !["pendiente", "despachada"].includes(data.estado)
  ) {
    throw new Error(
      "El servidor no confirmó la creación de la orden. Revisa despacho antes de volver a enviarla.",
    );
  }

  return data;
}

export async function obtenerOrdenesPendientes(
  signal?: AbortSignal,
): Promise<Orden[]> {
  const data = await ordersRequest<Orden[]>("?estado=pendiente", {
    signal,
  });

  if (
    !Array.isArray(data) ||
    data.some(
      (item) =>
        !item || typeof item._id !== "string" || !Array.isArray(item.items),
    )
  ) {
    throw new Error("El servidor devolvió órdenes con formato inesperado.");
  }

  return data;
}

export async function despacharOrden(
  id: string,
  payload: DespacharOrdenPayload,
): Promise<DespachoResponse> {
  const data = await ordersRequest<DespachoResponse>(
    `/${encodeURIComponent(id)}/dispatch`,
    {
      method: "POST",

      body: JSON.stringify({
        clienteId: payload.clienteId || null,

        puntosCanjeados: payload.puntosCanjeados || 0,

        metodoPago: payload.metodoPago,
      }),
    },
  );

  if (!data || data.estado !== "despachada") {
    throw new Error(
      "No se pudo confirmar el estado de la orden. Actualiza despacho antes de reintentar.",
    );
  }

  return data;
}
