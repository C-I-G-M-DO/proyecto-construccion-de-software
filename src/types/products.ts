import type { TipoMedida, UnidadStock } from "@/constants/measures";

export type Precio = {
  tipo: TipoMedida;
  valor: number;
  equivalencia?: number;
};

export type LoteProducto = {
  _id?: string;
  cantidadInicial?: number;
  cantidadDisponible: number;
  fechaVencimiento: string;
};

export type LoteInicial = {
  cantidad: number;
  fechaVencimiento: string;
};

export type HistorialRetirada = {
  _id?: string;
  loteId: string;
  cantidad: number;
  fechaRetirada: string;
  fechaVencimiento: string;
  motivo: string;
};

export type Producto = {
  _id: string;
  nombre: string;
  precios: Precio[];
  stock: number;
  equivalenciaPaquete?: number;
  imagen: string | null;
  unidadStock?: UnidadStock;
  categoria?: string;

  // Control de vencimientos
  vence?: boolean;
  lotes?: LoteProducto[];

  // Registro histórico de productos retirados
  historialRetiradas?: HistorialRetirada[];
};

export type NuevoProductoPayload = Pick<
  Producto,
  "nombre" | "precios" | "stock" | "unidadStock" | "imagen"
> & {
  lotesIniciales?: LoteInicial[];
};

export type CartItem = {
  id: string;
  productoId: string;
  nombre: string;
  tipo: TipoMedida;
  precio: number;
  cantidad: number;
  total: number;
  equivalencia?: number;
};
