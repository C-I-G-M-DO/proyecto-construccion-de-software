/** Fields already consumed from /api/reports and /api/reports/daily. */
export type Reporte = {
  fecha?: string;
  cantidadVentas?: number;
  ingresos?: number;
  subtotal?: number;
  descuentosPuntos?: number;
  puntosCanjeados?: number;
  puntosGanados?: number;
  ticketPromedio?: number;
  ventasPorMetodoPago?: { efectivo?: number; tarjeta?: number; transferencia?: number; mixto?: number };
  productosVendidos?: { productoId?: string; nombre?: string; cantidadVendida?: number; unidadesStockConsumidas?: number; totalVendido?: number }[];
};
export type ReportPeriod = { desde: string; hasta: string };
