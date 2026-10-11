import type { ProductCategory } from '@/constants/product-categories';
import type { ReportPeriod } from './reports';

export type AnalyticsMetric = 'importe' | 'unidades' | 'libras';
export type AnalyticsGrouping = 'dia' | 'diaSemana' | 'hora';
export type AnalyticsPreset = 'hoy' | 'semana' | 'ultimos30' | 'mes';
export type AnalyticsFilters = ReportPeriod & {
  productoId: string;
  categoria: ProductCategory | 'todos';
  metrica: AnalyticsMetric;
  agrupacion: AnalyticsGrouping;
  ranking: 'mas' | 'menos';
};
export type ProductRank = { id: string; nombre: string; valor: number; categoria: ProductCategory };
export type DemandPoint = { id: string; label: string; valor: number; total: number; dias: number };
export type AnalyticsResult = {
  ranking: ProductRank[];
  series: DemandPoint[];
  ventasDisponibles: number;
  ventasFueraPeriodo: number;
  ventasSinDetalle: number;
  ventasFechaInvalida: number;
  ultimaVenta: string | null;
  lineasOmitidas: number;
  error: string | null;
};
