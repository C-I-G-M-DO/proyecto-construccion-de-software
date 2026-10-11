import { MEDIDAS } from '../constants/measures';
import { productCategory, normalizedText } from './product-categories';
import type { Producto } from '../types/products';
import type { Venta } from '../types/sales';
import type { AnalyticsFilters, AnalyticsPreset, AnalyticsResult, DemandPoint } from '../types/analytics';
import type { ReportPeriod } from '../types/reports';
import { dateKey, daysBetween, formatDate, parseDate } from './dates';

export const ANALYTICS_TIME_ZONE = 'America/Santo_Domingo';
const clock = new Intl.DateTimeFormat('en-CA', { timeZone: ANALYTICS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
export function businessTime(timestamp: string): { day: string; hour: number; weekday: number } | null {
  if (typeof timestamp !== 'string' || !timestamp.trim()) return null;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = Object.fromEntries(clock.formatToParts(date).map(part => [part.type, part.value]));
  const day = `${parts.year}-${parts.month}-${parts.day}`, parsed = parseDate(day);
  return parsed ? { day, hour: Number(parts.hour), weekday: (parsed.getDay() + 6) % 7 } : null;
}

/** Presets use the same Dominican calendar dates as the sale timestamps. */
export function analyticsPresetPeriod(preset: AnalyticsPreset, today = businessTime(new Date().toISOString())!.day): ReportPeriod {
  const start = parseDate(today);
  if (!start) throw new Error('Fecha inválida para el período de análisis.');
  if (preset === 'mes') start.setDate(1);
  else start.setDate(start.getDate() - (preset === 'semana' ? 6 : preset === 'ultimos30' ? 29 : 0));
  return { desde: dateKey(start), hasta: today };
}

export function analyticsEmptyMessage(result: AnalyticsResult, filters: Pick<AnalyticsFilters, 'desde' | 'hasta'>): string {
  if (!result.ventasDisponibles) {
    if (result.ventasFueraPeriodo) return `No hay ventas entre ${formatDate(filters.desde)} y ${formatDate(filters.hasta)}. La última venta registrada es del ${formatDate(result.ultimaVenta!)}.`;
    if (result.ventasFechaInvalida) return 'Las ventas recibidas no tienen una fecha válida para el análisis. Actualiza los datos; si continúa, revisa las fechas guardadas en el servidor.';
    return 'Todavía no hay ventas realizadas para analizar. Las órdenes pendientes aparecerán después de despacharlas.';
  }
  if (result.ventasSinDetalle === result.ventasDisponibles) return `Hay ${result.ventasDisponibles} ventas en este período, pero no incluyen el detalle de sus productos. Ese detalle es necesario para construir las gráficas.`;
  if (result.lineasOmitidas) return 'Los productos de estas ventas no tienen datos suficientes para la medida elegida. Prueba «Valor vendido (RD$)» o actualiza los datos.';
  return `Hay ${result.ventasDisponibles} ventas en este período, pero ningún producto coincide con la categoría y la medida elegidas. Prueba todas las categorías y «Valor vendido (RD$)».`;
}
export function analyticsPeriodError(filters: Pick<AnalyticsFilters, 'desde' | 'hasta' | 'agrupacion'>): string | null {
  const span = daysBetween(filters.desde, filters.hasta);
  if (span === null || span < 0) return 'Selecciona un período válido.';
  if (filters.agrupacion === 'dia' && span >= 366) return 'Para más de 366 días, elige la vista por día de semana u hora.';
  return null;
}

/** Known fixed measures are normalized; historical packages need their own equivalence. */
function baseAmount(item: NonNullable<Venta['items']>[number]): { unit: 'unidad' | 'libra'; quantity: number } | null {
  const measure = MEDIDAS.find(value => value.tipo === item.tipo);
  if (!measure) return null;
  if (item.tipo === 'paquete' && !Number.isFinite(item.equivalencia) && Number.isFinite(item.unidadesStockConsumidas) && item.unidadesStockConsumidas! > 0) return { unit: 'unidad', quantity: item.unidadesStockConsumidas! };
  const factor = item.tipo === 'paquete' ? item.equivalencia : measure.factor;
  if (!Number.isFinite(factor) || factor! <= 0) return null;
  return { unit: measure.unidadStock, quantity: item.cantidad * factor! };
}
export function analyzeSales(sales: Venta[], products: Producto[], filters: AnalyticsFilters): AnalyticsResult {
  const error = analyticsPeriodError(filters);
  const empty = { ranking: [], series: [], ventasDisponibles: 0, ventasFueraPeriodo: 0, ventasSinDetalle: 0, ventasFechaInvalida: 0, ultimaVenta: null, lineasOmitidas: 0, error };
  if (error) return empty;
  const catalog = new Map(products.map(product => [product._id, product]));
  const ranking = new Map<string, AnalyticsResult['ranking'][number]>();
  const times = new Map<string, DemandPoint>();
  const start = parseDate(filters.desde)!, end = parseDate(filters.hasta)!;
  const span = daysBetween(filters.desde, filters.hasta)! + 1;
  if (filters.agrupacion === 'dia') {
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const id = dateKey(date); times.set(id, { id, label: date.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }), total: 0, valor: 0, dias: 1 });
    }
  } else if (filters.agrupacion === 'hora') {
    for (let hour = 0; hour < 24; hour++) times.set(String(hour), { id: String(hour), label: `${String(hour).padStart(2, '0')}:00`, total: 0, valor: 0, dias: span });
  } else {
    const counts = Array(7).fill(0);
    const first = (start.getDay() + 6) % 7;
    for (let offset = 0; offset < 7; offset++) counts[(first + offset) % 7] = Math.floor(span / 7) + (offset < span % 7 ? 1 : 0);
    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach((label, index) => times.set(String(index), { id: String(index), label, total: 0, valor: 0, dias: counts[index] }));
  }
  let available = 0, omitted = 0, outside = 0, withoutItems = 0, invalidDates = 0;
  let latest: string | null = null;
  const seen = new Set<string>();
  for (const sale of sales) {
    if (!sale || seen.has(sale._id)) continue;
    seen.add(sale._id);
    if (['cancelada', 'cancelado', 'pendiente', 'devuelta'].includes(normalizedText(sale.estado ?? ''))) continue;
    const time = businessTime(sale.createdAt);
    if (!time) { invalidDates++; continue; }
    if (!latest || time.day > latest) latest = time.day;
    if (time.day < filters.desde || time.day > filters.hasta) { outside++; continue; }
    available++;
    if (!Array.isArray(sale.items) || !sale.items.length) withoutItems++;
    for (const item of Array.isArray(sale.items) ? sale.items : []) {
      if (!item || typeof item.nombre !== 'string' || !Number.isFinite(item.cantidad) || item.cantidad <= 0 || !Number.isFinite(item.precio) || item.precio < 0) { omitted++; continue; }
      const id = item.productoId || `nombre:${normalizedText(item.nombre)}`;
      const product = catalog.get(id), category = productCategory(product ?? { nombre: item.nombre });
      if (filters.categoria !== 'todos' && category !== filters.categoria) continue;
      let amount = item.cantidad * item.precio;
      if (filters.metrica !== 'importe') {
        const base = baseAmount(item);
        if (!base) { omitted++; continue; }
        if (base.unit !== (filters.metrica === 'unidades' ? 'unidad' : 'libra')) continue;
        amount = base.quantity;
      }
      if (!Number.isFinite(amount)) { omitted++; continue; }
      const row = ranking.get(id) ?? { id, nombre: product?.nombre ?? item.nombre, valor: 0, categoria: category };
      row.valor += amount; ranking.set(id, row);
      if (filters.productoId && filters.productoId !== id) continue;
      const point = times.get(filters.agrupacion === 'dia' ? time.day : String(filters.agrupacion === 'hora' ? time.hour : time.weekday));
      if (point) point.total += amount;
    }
  }
  const rows = [...ranking.values()].map(row => ({ ...row, valor: Math.round(row.valor * 1e6) / 1e6 }));
  rows.sort((a, b) => (filters.ranking === 'mas' ? b.valor - a.valor : a.valor - b.valor) || a.nombre.localeCompare(b.nombre, 'es'));
  return { ranking: rows, series: [...times.values()].map(point => ({ ...point, valor: point.dias ? point.total / point.dias : 0 })), ventasDisponibles: available, ventasFueraPeriodo: outside, ventasSinDetalle: withoutItems, ventasFechaInvalida: invalidDates, ultimaVenta: latest, lineasOmitidas: omitted, error: null };
}
