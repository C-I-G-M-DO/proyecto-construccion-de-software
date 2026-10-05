import type { Reporte, ReportPeriod } from '@/types/reports';
import { formatMoney } from './currency';
import { formatDate } from './dates';

export function reportRows(report: Reporte): (string | number)[][] {
  const value = (amount?: number): string | number => amount ?? 'No disponible';
  return [
    ['RESUMEN', 'Valor'],
    ['Cantidad de ventas', value(report.cantidadVentas)], ['Ingresos', value(report.ingresos)],
    ['Subtotal', value(report.subtotal)], ['Descuentos por puntos', value(report.descuentosPuntos)],
    ['Puntos canjeados', value(report.puntosCanjeados)], ['Puntos ganados', value(report.puntosGanados)],
    ['Ticket promedio', value(report.ticketPromedio)], [], ['MÉTODOS DE PAGO', 'Total'],
    ...Object.entries(report.ventasPorMetodoPago ?? {}).map(([label, amount]) => [label, value(amount)]),
    [], ['PRODUCTOS VENDIDOS', 'Cantidad vendida', 'Stock consumido', 'Total vendido'],
    ...(report.productosVendidos ?? []).map(item => [item.nombre || 'Producto', value(item.cantidadVendida), value(item.unidadesStockConsumidas), value(item.totalVendido)]),
  ];
}

export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export function reportHtml(report: Reporte, period: ReportPeriod): string {
  const amount = (value?: number) => value === undefined ? 'No disponible' : formatMoney(value);
  const count = (value?: number) => value === undefined ? 'No disponible' : value.toLocaleString('es-DO');
  const summary = [['Ventas', count(report.cantidadVentas)], ['Ingresos', amount(report.ingresos)], ['Subtotal', amount(report.subtotal)], ['Descuentos por puntos', amount(report.descuentosPuntos)], ['Puntos canjeados', count(report.puntosCanjeados)], ['Puntos ganados', count(report.puntosGanados)], ['Ticket promedio', amount(report.ticketPromedio)]];
  const rows = (values: string[][]) => values.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte Surtío ${escapeHtml(period.desde)} - ${escapeHtml(period.hasta)}</title><style>
    @page { margin: 18mm; } body { font: 14px Arial,sans-serif; color: #1b1b1c; } h1 { color: #c00000; } h2 { font-size: 18px; margin-top: 28px; } table { width: 100%; border-collapse: collapse; } td,th { text-align: left; padding: 10px; border-bottom: 1px solid #e5e2e1; } th { background: #fcf9f8; } tr { break-inside: avoid; } footer { margin-top: 28px; color: #5d3f3b; }
    </style></head><body><h1>Surtío</h1><h2>Reporte de ventas</h2><p>${escapeHtml(formatDate(period.desde))} — ${escapeHtml(formatDate(period.hasta))}</p><h2>Resumen</h2><table>${rows(summary)}</table>
    <h2>Métodos de pago</h2><table>${rows(Object.entries(report.ventasPorMetodoPago ?? {}).map(([label, value]) => [label, amount(value)]))}</table>
    <h2>Productos vendidos</h2><table><thead><tr><th>Producto</th><th>Cantidad vendida</th><th>Stock consumido</th><th>Total</th></tr></thead><tbody>${rows((report.productosVendidos ?? []).map(item => [item.nombre || 'Producto', count(item.cantidadVendida), count(item.unidadesStockConsumidas), amount(item.totalVendido)]))}</tbody></table><footer>Reporte generado por Surtío</footer></body></html>`;
}
