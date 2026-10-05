import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { BusinessDate, LoadNotice, Metric } from '@/components/business-ui';
import DatePicker from '@/components/ui/date-picker';
import { useReports } from '@/hooks/use-reports';
import { useSurtioStyles } from '@/hooks/use-surtio-theme';
import { exportExcel, exportPDF } from '@/services/report-exports.web';
import { businessStyles } from '@/styles/business.styles';
import type { Reporte, ReportPeriod } from '@/types/reports';
import { formatMoney } from '@/utils/currency';
import { dateKey, formatDate } from '@/utils/dates';

function ReportDetails({ report, period }: { report: Reporte; period: ReportPeriod }) {
  const s = useSurtioStyles(businessStyles);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [breakdown, setBreakdown] = useState(false);
  async function download(format: 'excel' | 'pdf') {
    setBusy(true); setError(null);
    try { if (format === 'excel') await exportExcel(report, period); else await exportPDF(report, period); }
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

function DailyReport({ report }: { report: Reporte }) {
  const s = useSurtioStyles(businessStyles), [expanded, setExpanded] = useState(false);
  return <View style={s.card}><View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ gap: 4 }}><Text style={s.heading}>{report.fecha ? formatDate(report.fecha) : 'Fecha no disponible'}</Text><Text style={s.muted}>{report.cantidadVentas ?? '—'} ventas · {report.ingresos === undefined ? '—' : formatMoney(report.ingresos)}</Text></View>{report.fecha && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={s.link}>{expanded ? 'Ocultar reporte' : 'Ver reporte'}</Text></Pressable>}</View>{expanded && report.fecha && <ReportDetails report={report} period={{ desde: report.fecha, hasta: report.fecha }} />}</View>;
}

export default function ReportsScreen() {
  const s = useSurtioStyles(businessStyles), reports = useReports();
  const [period, setPeriod] = useState<ReportPeriod>({ desde: '', hasta: '' });
  useEffect(() => { const today = dateKey(); setPeriod({ desde: today, hasta: today }); }, []);
  const changeDate = (key: keyof ReportPeriod, value: string) => { reports.clearRange(); setPeriod(current => ({ ...current, [key]: value })); };
  const invalid = period.desde > period.hasta;
  const canGenerate = !!period.desde && !!period.hasta && !invalid && !reports.rangeLoading;
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={reports.loading} onRefresh={() => void reports.reload()} />}>
    <View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ gap: 6 }}><Text style={s.title}>Reportes</Text><Text style={s.muted}>Consulta ventas e ingresos por período.</Text></View><BusinessDate /></View>
    {reports.error && <LoadNotice message={reports.error} onRetry={() => void reports.reload()} />}
    <View style={s.card}><Text style={s.heading}>Resumen de hoy</Text>{reports.today ? <ReportDetails report={reports.today} period={{ desde: dateKey(), hasta: dateKey() }} /> : <Text style={s.muted}>{reports.loading ? 'Cargando reporte…' : 'El resumen de hoy no está disponible.'}</Text>}</View>
    <View style={s.card}>
      <Text style={s.heading}>Elegir un período</Text><Text style={s.muted}>Selecciona el primer y el último día. Ambos se incluyen en el reporte.</Text>
      <View style={[s.row, { alignItems: 'flex-start' }]}><DatePicker style={{ flexGrow: 1, flexBasis: 220 }} label="Desde" value={period.desde} onChange={value => changeDate('desde', value)} /><DatePicker style={{ flexGrow: 1, flexBasis: 220 }} label="Hasta" value={period.hasta} minDate={period.desde} onChange={value => changeDate('hasta', value)} /></View>
      {invalid && <Text accessibilityRole="alert" style={s.link}>La fecha inicial no puede ser posterior a la final.</Text>}
      <Pressable accessibilityRole="button" disabled={!canGenerate} onPress={() => void reports.generate({ ...period })} style={[s.button, { alignSelf: 'flex-start', opacity: canGenerate ? 1 : 0.5 }]}><Text style={s.buttonText}>{reports.rangeLoading ? 'Generando…' : 'Generar reporte'}</Text></Pressable>
      {reports.rangeError && <Text accessibilityRole="alert" style={s.link}>{reports.rangeError}</Text>}
      {reports.result && <View style={{ gap: 16 }}><Text style={s.muted}>{formatDate(reports.result.period.desde)} — {formatDate(reports.result.period.hasta)}</Text><ReportDetails key={`${reports.result.period.desde}/${reports.result.period.hasta}`} report={reports.result.report} period={reports.result.period} /></View>}
    </View>
    <Text style={s.heading}>Reportes diarios</Text>
    {reports.daily.map((report, index) => <DailyReport key={report.fecha || index} report={report} />)}
    {!reports.daily.length && <LoadNotice message={reports.loading ? 'Cargando reportes diarios…' : reports.error ? 'Los reportes diarios no están disponibles.' : 'Todavía no hay reportes diarios.'} />}
  </ScrollView>;
}
