import { consumoEnStock } from '../constants/measures';
import type { DemoDraftLine, DemoState } from '../types/demo';
import type { CartItem, Producto } from '../types/products';
import type { Reporte, ReportPeriod } from '../types/reports';
import type { Venta } from '../types/sales';
import { dateKey, parseDate } from './dates';
import { newestSales, saleTotal } from './history';

export const DEMO_STORAGE_KEY = 'surtio.demo.v1';
const rounded = (value: number) => Math.round(value * 1e6) / 1e6;

export function createDemoState(now = new Date()): DemoState {
  const day = (offset: number) => { const date = new Date(now); date.setDate(date.getDate() + offset); return dateKey(date); };
  const product = (_id: string, nombre: string, stock: number, price: number, expires?: number): Producto => ({
    _id, nombre, stock, imagen: '', unidadStock: 'unidad', precios: [{ tipo: 'unidad', valor: price }],
    ...(expires === undefined ? {} : { lotes: [{ cantidadDisponible: stock, fechaVencimiento: day(expires) }] }),
  });
  const products = [
    product('demo-pan', 'Pan de agua', 24, 15, 1),
    product('demo-leche', 'Leche entera', 12, 85, 5),
    product('demo-yogur', 'Yogur de fresa', 4, 55, -1),
    product('demo-agua', 'Agua embotellada', 36, 25),
    product('demo-cafe', 'Café molido', 18, 40),
    { _id: 'demo-salami', nombre: 'Salami', stock: 8, imagen: '', unidadStock: 'libra' as const,
      precios: [{ tipo: 'libra' as const, valor: 150 }, { tipo: 'cuarta' as const, valor: 40 }, { tipo: 'onza' as const, valor: 12 }],
      lotes: [{ cantidadDisponible: 8, fechaVencimiento: day(10) }] },
  ];
  // Remaining stock above represents the opening balance of this fictional demo.
  const sales: Venta[] = Array.from({ length: 9 }, (_, index) => {
    const date = new Date(now); date.setDate(date.getDate() - index); date.setHours(8 + index % 8, 15, 0, 0);
    const item = products[index % 2 ? 4 : 3], quantity = 2 + index % 3;
    return { _id: `demo-sale-${index}`, numeroOrden: 1009 - index, subtotal: quantity * item.precios[0].valor, estado: 'Despachada', metodoPago: 'efectivo',
      createdAt: date.toISOString(), items: [{ productoId: item._id, nombre: item.nombre, tipo: 'unidad', precio: item.precios[0].valor, cantidad: quantity }] };
  });
  return { version: 1, products, sales: newestSales(sales), pending: null };
}

/** Only non-expired lots and undated remaining stock can be sold in the demo. */
export function demoAvailable(product: Producto, now = new Date()): number {
  const expired = (product.lotes ?? []).filter(lot => lot.fechaVencimiento < dateKey(now)).reduce((sum, lot) => sum + lot.cantidadDisponible, 0);
  return Math.max(0, rounded(product.stock - expired));
}

export function prepareDemoOrder(state: DemoState, lines: DemoDraftLine[], now = new Date()): DemoState {
  if (state.pending) throw new Error('Confirma o cancela la orden pendiente primero.');
  if (!lines.length) throw new Error('Agrega al menos un producto a la orden.');
  const consumption = new Map<string, number>();
  const pending: CartItem[] = lines.map((line, index) => {
    const product = state.products.find(item => item._id === line.productoId);
    const price = product?.precios.find(item => item.tipo === line.tipo);
    if (!product || !price || !Number.isFinite(price.valor) || price.valor <= 0) throw new Error('El producto o su precio no están disponibles.');
    if (!Number.isInteger(line.cantidad) || line.cantidad <= 0) throw new Error('Usa una cantidad entera mayor que cero para la presentación elegida.');
    const factor = consumoEnStock(line.tipo, price.equivalencia, product.unidadStock);
    if (!Number.isFinite(factor) || factor <= 0) throw new Error('La medida no es compatible con el stock.');
    const used = rounded((consumption.get(product._id) ?? 0) + factor * line.cantidad);
    if (used > demoAvailable(product, now)) throw new Error(`No hay stock disponible suficiente de ${product.nombre}.`);
    consumption.set(product._id, used);
    return { id: `demo-line-${index}`, productoId: product._id, nombre: product.nombre, tipo: line.tipo, precio: price.valor,
      cantidad: line.cantidad, equivalencia: price.equivalencia, total: Math.round(price.valor * line.cantidad * 100) / 100 };
  });
  return { ...state, pending };
}

export function dispatchDemoOrder(state: DemoState, now = new Date()): DemoState {
  if (!state.pending?.length) throw new Error('No hay una orden pendiente.');
  // Recheck stock at dispatch; product prices captured by the order remain fixed.
  prepareDemoOrder({ ...state, pending: null }, state.pending, now);
  const consumption = new Map<string, number>();
  for (const line of state.pending) {
    const product = state.products.find(item => item._id === line.productoId)!;
    const amount = consumoEnStock(line.tipo, line.equivalencia, product.unidadStock) * line.cantidad;
    consumption.set(product._id, rounded((consumption.get(product._id) ?? 0) + amount));
  }
  const products = state.products.map(product => {
    const amount = consumption.get(product._id);
    if (!amount) return product;
    let remaining = amount;
    // FEFO is a demo policy, not an assumption about the production backend.
    const lotes = [...(product.lotes ?? [])].sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)).map(lot => {
      if (lot.fechaVencimiento < dateKey(now)) return { ...lot };
      const taken = Math.min(lot.cantidadDisponible, remaining); remaining = rounded(remaining - taken);
      return { ...lot, cantidadDisponible: rounded(lot.cantidadDisponible - taken) };
    });
    return { ...product, stock: rounded(product.stock - amount), lotes };
  });
  const number = Math.max(1000, ...state.sales.map(sale => Number(sale.numeroOrden) || 0)) + 1;
  const total = Math.round(state.pending.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
  const sale: Venta = { _id: `demo-sale-${number}`, numeroOrden: number, subtotal: total, total, estado: 'Despachada', metodoPago: 'efectivo', createdAt: now.toISOString(), items: state.pending.map(({ productoId, nombre, tipo, precio, cantidad }) => ({ productoId, nombre, tipo, precio, cantidad })) };
  return { ...state, products, pending: null, sales: newestSales([sale, ...state.sales]) };
}

export function demoReport(state: DemoState, period: ReportPeriod): Reporte {
  if (!parseDate(period.desde) || !parseDate(period.hasta) || period.desde > period.hasta) throw new Error('Selecciona un período válido.');
  const sales = state.sales.filter(sale => { const day = dateKey(new Date(sale.createdAt)); return day >= period.desde && day <= period.hasta; });
  const ingresos = sales.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const products = new Map<string, NonNullable<Reporte['productosVendidos']>[number]>();
  for (const sale of sales) for (const line of sale.items ?? []) {
    const key = line.productoId ?? line.nombre, product = state.products.find(item => item._id === line.productoId);
    const current = products.get(key) ?? { productoId: line.productoId, nombre: line.nombre, cantidadVendida: 0, unidadesStockConsumidas: 0, totalVendido: 0 };
    current.cantidadVendida! += line.cantidad;
    const price = product?.precios.find(item => item.tipo === line.tipo);
    const factor = consumoEnStock(line.tipo as CartItem['tipo'], price?.equivalencia, product?.unidadStock);
    current.unidadesStockConsumidas! = rounded(current.unidadesStockConsumidas! + line.cantidad * factor);
    current.totalVendido! += line.cantidad * line.precio;
    products.set(key, current);
  }
  return { cantidadVentas: sales.length, ingresos, subtotal: ingresos, ticketPromedio: sales.length ? ingresos / sales.length : 0,
    ventasPorMetodoPago: { efectivo: ingresos }, productosVendidos: [...products.values()] };
}

/** Reject damaged or obsolete demo storage rather than breaking the public page. */
export function restoreDemoState(raw: string | null): DemoState | null {
  try {
    const state: DemoState = JSON.parse(raw ?? 'null');
    if (!state || state.version !== 1 || !Array.isArray(state.products) || !Array.isArray(state.sales) || !(state.pending === null || Array.isArray(state.pending))) return null;
    const ids = new Set<string>();
    for (const product of state.products) {
      if (!product || typeof product._id !== 'string' || ids.has(product._id) || typeof product.nombre !== 'string' || !product.nombre.trim() || !['unidad', 'libra'].includes(product.unidadStock!) || !Number.isFinite(product.stock) || product.stock < 0 || !Array.isArray(product.precios) || !product.precios.length) return null;
      ids.add(product._id);
      for (const price of product.precios) if (!price || !Number.isFinite(price.valor) || price.valor <= 0 || !(consumoEnStock(price.tipo, price.equivalencia, product.unidadStock) > 0)) return null;
      if (product.lotes !== undefined && !Array.isArray(product.lotes)) return null;
      for (const lot of product.lotes ?? []) if (!lot || !parseDate(lot.fechaVencimiento) || !Number.isFinite(lot.cantidadDisponible) || lot.cantidadDisponible < 0) return null;
      if ((product.lotes ?? []).reduce((sum, lot) => sum + lot.cantidadDisponible, 0) > product.stock + 1e-6) return null;
    }
    for (const sale of state.sales) {
      if (!sale || typeof sale._id !== 'string' || !Number.isFinite(Date.parse(sale.createdAt)) || !Number.isFinite(sale.subtotal) || sale.subtotal < 0 || !Array.isArray(sale.items)) return null;
      for (const line of sale.items) if (!line || typeof line.nombre !== 'string' || !ids.has(line.productoId!) || !Number.isInteger(line.cantidad) || line.cantidad <= 0 || !Number.isFinite(line.precio) || line.precio <= 0) return null;
    }
    if (state.pending) {
      const checked = prepareDemoOrder({ ...state, pending: null }, state.pending);
      if (JSON.stringify(checked.pending) !== JSON.stringify(state.pending)) return null;
    }
    return state;
  } catch { return null; }
}
