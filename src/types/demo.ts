import type { CartItem, Producto } from './products';
import type { Venta } from './sales';

/** Synthetic, browser-local records; never submitted to Surtío's APIs. */
export type DemoState = {
  version: 1;
  products: Producto[];
  sales: Venta[];
  pending: CartItem[] | null;
};
export type DemoDraftLine = { productoId: string; tipo: CartItem['tipo']; cantidad: number };
