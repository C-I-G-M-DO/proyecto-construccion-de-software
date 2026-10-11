import { useCallback } from 'react';
import { useFocusedList } from './use-focused-list';
import type { Producto } from '@/types/products';
import type { Venta } from '@/types/sales';

export function useSalesAnalysis() {
  const sales = useFocusedList<Venta>('sales'), products = useFocusedList<Producto>('products');
  const reload = useCallback(() => { void sales.reload(); void products.reload(); }, [sales.reload, products.reload]);
  return { sales: sales.data, products: products.data, loading: sales.loading || products.loading, error: sales.error || products.error, reload };
}
