export type Venta = {
  _id: string;
  numeroOrden?: number | string;
  subtotal: number;
  total?: number;
  estado?: string;
  metodoPago?: string;
  createdAt: string;
  items?: { productoId?: string; nombre: string; cantidad: number; precio: number; tipo: string }[];
};

export type HistoryFilters = {
  periodo: 'todos' | 'dia' | 'semana' | 'mes';
  orden: string;
  producto: string;
  montoMin: string;
  montoMax: string;
};

/** Proposed API query contract; local filtering is used until the API supports it. */
export type HistoryQuery = { desde?: string; hasta?: string; orden?: string; producto?: string; montoMin?: number; montoMax?: number };
