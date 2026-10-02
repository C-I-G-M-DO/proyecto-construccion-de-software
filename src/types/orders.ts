import type { TipoMedida } from '@/constants/measures';

export type Orden = {
  _id: string;
  numeroOrden: number;
  estado: 'pendiente' | 'despachada' | 'cancelada';
  createdAt: string;
  createdByName?: string;
  subtotal: number;
  items: {
    productoId: string;
    nombre: string;
    tipo: TipoMedida;
    cantidad: number;
    precio: number;
    total: number;
    equivalencia?: number;
  }[];
};
