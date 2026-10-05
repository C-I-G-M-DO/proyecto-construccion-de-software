

import type { TipoMedida, UnidadStock } from '@/constants/measures';

export type Producto = {
  _id: string;
  nombre: string;
  precios: Precio[]; //  array
  stock: number;
  equivalenciaPaquete?: number;
  imagen: string;
  unidadStock?: UnidadStock;
  /** Optional API integration: only remaining stock in each dated lot. */
  lotes?: LoteProducto[];
};

export type LoteProducto = { _id?: string; cantidadDisponible: number; fechaVencimiento: string };
export type LoteInicial = { cantidad: number; fechaVencimiento: string };
export type NuevoProductoPayload = Pick<Producto, 'nombre' | 'precios' | 'stock' | 'unidadStock' | 'imagen'> & { lotesIniciales?: LoteInicial[] };

 export type Precio = {
  tipo: TipoMedida;
  valor: number;
  equivalencia?: number; // 👈 SOLO para paquetes
};

export type CartItem = {
  id: string; // id del item en carrito
  productoId: string; // 🔥 id REAL del producto
  nombre: string;
  tipo: TipoMedida;
  precio: number;
  cantidad: number;
  total: number;
  equivalencia?: number;
};
