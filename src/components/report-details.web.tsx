import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Metric } from '@/components/business-ui';
import { useSurtioStyles } from '@/hooks/use-surtio-theme';
import { exportExcel, exportPDF } from '@/services/report-exports.web';
import { businessStyles } from '@/styles/business.styles';
import type { Reporte, ReportPeriod } from '@/types/reports';
import { formatMoney } from '@/utils/currency';

export default function ReportDetails({ report, period, demo = false }: { report: Reporte; period: ReportPeriod; demo?: boolean }) {
  const s = useSurtioStyles(businessStyles);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [breakdown, setBreakdown] = useState(false);
  async function download(format: 'excel' | 'pdf') {
    setBusy(true); setError(null);
    try { if (format === 'excel') await exportExcel(report, period, demo); else await exportPDF(report, period, demo); }
    catch { setError('No pudimos descargar el reporte. Inténtalo de nuevo.'); }
    finally { setBusy(false); }
  }
  return <View style={{ gap: 16 }}>
    <View style={s.row}><Metric label="Ingresos" value={report.ingresos === undefined ? '—' : formatMoney(report.ingresos)} /><Metric label="Ventas" value={report.cantidadVentas === undefined ? '—' : String(report.cantidadVentas)} /><Metric label="Ticket promedio" value={report.ticketPromedio === undefined ? '—' : formatMoney(report.ticketPromedio)} /></View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: breakdown }} onPress={() => setBreakdown(value => !value)} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}><Text style={s.link}>{breakdown ? 'Ocultar desglose' : 'Ver desglose de pagos y puntos'}</Text></Pressable>
    {breakdown && <View style={{ gap: 10 }}>
      {([['Subtotal', report.subtotal, true], ['Descuentos por puntos', report.descuentosPuntos, true], ['Puntos canjeados', report.puntosCanjeados, false], ['Puntos ganados', report.puntosGanados, false]] as const).map(([label, value, monetary]) => <View key={label} style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.muted}>{label}</Text><Text style={s.text}>{value === undefined ? '—' : monetary ? formatMoney(value) : value.toLocaleString('es-DO')}</Text></View>)}
      {Object.entries(report.ventasPorMetodoPago ?? {}).map(([method, value]) => <View key={method} style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.muted}>{method}</Text><Text style={s.text}>{value === undefined ? '—' : formatMoney(value)}</Text></View>)}
    </View>}
    {!!report.productosVendidos?.length && <View style={{ gap: 10 }}><Text style={s.heading}>Productos vendidos</Text>{report.productosVendidos.map((product, index) => <View key={product.productoId || index} style={[s.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1, gap: 4 }}><Text style={s.text}>{product.nombre || 'Producto'}</Text><Text style={s.muted}>{product.cantidadVendida ?? '—'} vendidos · {product.unidadesStockConsumidas ?? '—'} de stock consumido</Text></View><Text style={s.text}>{product.totalVendido === undefined ? '—' : formatMoney(product.totalVendido)}</Text></View>)}</View>}
    <View style={s.row}>{(['excel', 'pdf'] as const).map(format => <Pressable key={format} accessibilityRole="button" disabled={busy} onPress={() => void download(format)} style={[s.button, { opacity: busy ? 0.5 : 1 }]}><Text style={s.buttonText}>{format === 'excel' ? 'Descargar Excel' : 'Imprimir / guardar PDF'}</Text></Pressable>)}</View>
    {error && <Text accessibilityRole="alert" style={s.link}>{error}</Text>}
  </View>;
}
