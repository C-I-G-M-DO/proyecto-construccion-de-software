import type { HistoryFilters, HistoryQuery, Venta } from '@/types/sales';
import { dateKey } from './dates';

export const INITIAL_FILTERS: HistoryFilters = { periodo: 'todos', orden: '', producto: '', montoMin: '', montoMax: '' };
export const saleTotal = (sale: Venta) => Number.isFinite(sale.total) ? sale.total! : Number(sale.subtotal) || 0;
export const newestSales = (sales: Venta[]) => [...sales].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
export const parseAmount = (value: string) => value.trim() ? Number(value.replace(',', '.')) : undefined;

export function historyQuery(filters: HistoryFilters, now = new Date()): HistoryQuery {
  const query: HistoryQuery = {};
  if (filters.periodo !== 'todos') {
    const start = new Date(now);
    if (filters.periodo === 'semana') start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    if (filters.periodo === 'mes') start.setDate(1);
    query.desde = dateKey(start);
    query.hasta = dateKey(now);
  }
  if (filters.orden.trim()) query.orden = filters.orden.trim();
  if (filters.producto.trim()) query.producto = filters.producto.trim();
  const min = parseAmount(filters.montoMin), max = parseAmount(filters.montoMax);
  if (min !== undefined && Number.isFinite(min) && min >= 0) query.montoMin = min;
  if (max !== undefined && Number.isFinite(max) && max >= 0) query.montoMax = max;
  return query;
}

export function filterSales(sales: Venta[], filters: HistoryFilters, now = new Date()): Venta[] {
  const query = historyQuery(filters, now);
  return newestSales(sales).filter(sale => {
    const date = new Date(sale.createdAt);
    if (query.desde && (!Number.isFinite(date.getTime()) || dateKey(date) < query.desde || dateKey(date) > query.hasta!)) return false;
    if (query.orden && !String(sale.numeroOrden ?? '').includes(query.orden)) return false;
    if (query.producto && !sale.items?.some(item => normalize(item.nombre).includes(normalize(query.producto!)))) return false;
    const total = saleTotal(sale);
    return (query.montoMin === undefined || total >= query.montoMin) && (query.montoMax === undefined || total <= query.montoMax);
  });
}

export function amountError(filters: HistoryFilters): string | null {
  const min = parseAmount(filters.montoMin), max = parseAmount(filters.montoMax);
  if ([min, max].some(value => value !== undefined && (!Number.isFinite(value) || value < 0))) return 'Escribe montos iguales o mayores que cero.';
  if (min !== undefined && max !== undefined && min > max) return 'El monto mínimo debe ser menor o igual al máximo.';
  return null;
}
