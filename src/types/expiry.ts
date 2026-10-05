import type { UnidadStock } from '@/constants/measures';

export type ExpiryState = 'vencido' | 'pronto' | 'vigente';
export type ExpiryAlert = {
  id: string;
  productoId: string;
  nombre: string;
  imagen?: string;
  cantidad: number;
  unidadStock: UnidadStock;
  fechaVencimiento: string;
  diasRestantes: number;
  estado: ExpiryState;
};
