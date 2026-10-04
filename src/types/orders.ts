import type { TipoMedida } from "@/constants/measures";

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "mixto";

export type OrdenItem = {
  productoId: string;
  nombre: string;
  tipo: TipoMedida;
  cantidad: number;
  precio: number;
  total: number;
  equivalencia?: number | null;
  unidadesStockConsumidas?: number;
};

export type Orden = {
  _id: string;
  numeroOrden: number;

  estado: "pendiente" | "despachada" | "cancelada";

  createdAt: string;
  updatedAt?: string;

  createdByName?: string;

  clienteId?: string | null;
  clienteNombre?: string | null;
  telefonoCliente?: string | null;

  puntosCanjeados?: number;

  subtotal: number;

  items: OrdenItem[];

  saleId?: string | null;
};

export type DespacharOrdenPayload = {
  clienteId?: string | null;
  puntosCanjeados?: number;
  metodoPago: MetodoPago;
};

export type DespachoResponse = Orden & {
  venta?: {
    _id: string;
    numeroOrden: number;
    subtotal: number;
    total: number;
    metodoPago: MetodoPago;
  };

  fidelidad?: {
    nombre: string;
    telefono: string;
    puntosCanjeados: number;
    descuentoPuntos: number;
    puntosGanados: number;
    puntosDisponibles: number;
  } | null;
};
