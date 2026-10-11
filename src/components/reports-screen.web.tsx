import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { BusinessDate, LoadNotice } from '@/components/business-ui';
import DatePicker from '@/components/ui/date-picker';
import { useReports } from '@/hooks/use-reports';
import { useSurtioStyles } from '@/hooks/use-surtio-theme';
import ReportDetails from '@/components/report-details.web';
import { businessStyles } from '@/styles/business.styles';
import type { Reporte, ReportPeriod } from '@/types/reports';
import { formatMoney } from '@/utils/currency';
import { dateKey, formatDate } from '@/utils/dates';
import SalesAnalytics from '@/components/analytics/sales-analytics.web';
import { useSalesAnalysis } from '@/hooks/use-sales-analysis';
import { analyticsPresetPeriod } from '@/utils/analytics';
import type { AnalyticsPreset } from '@/types/analytics';

const presets: { id: AnalyticsPreset; label: string }[] = [
  { id: 'hoy', label: 'Hoy' }, { id: 'semana', label: 'Últimos 7 días' },
  { id: 'ultimos30', label: 'Últimos 30 días' }, { id: 'mes', label: 'Este mes' },
];

function DailyReport({ report }: { report: Reporte }) {
  const s = useSurtioStyles(businessStyles), [expanded, setExpanded] = useState(false);
  return <View style={s.card}><View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ gap: 4 }}><Text style={s.heading}>{report.fecha ? formatDate(report.fecha) : 'Fecha no disponible'}</Text><Text style={s.muted}>{report.cantidadVentas ?? '—'} ventas · {report.ingresos === undefined ? '—' : formatMoney(report.ingresos)}</Text></View>{report.fecha && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={s.link}>{expanded ? 'Ocultar reporte' : 'Ver reporte'}</Text></Pressable>}</View>{expanded && report.fecha && <ReportDetails report={report} period={{ desde: report.fecha, hasta: report.fecha }} />}</View>;
}

export default function ReportsScreen() {
  const s = useSurtioStyles(businessStyles), reports = useReports(), analysis = useSalesAnalysis();
  const [period, setPeriod] = useState<ReportPeriod>({ desde: '', hasta: '' });
  useEffect(() => { setPeriod(analyticsPresetPeriod('ultimos30')); }, []);
  const changePeriod = (next: ReportPeriod) => { reports.clearRange(); setPeriod(next); };
  const changeDate = (key: keyof ReportPeriod, value: string) => { reports.clearRange(); setPeriod(current => ({ ...current, [key]: value })); };
  const invalid = period.desde > period.hasta;
  const canGenerate = !!period.desde && !!period.hasta && !invalid && !reports.rangeLoading;
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={reports.loading || analysis.loading} onRefresh={() => { void reports.reload(); analysis.reload(); }} />}>
    <View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ gap: 6 }}><Text style={s.title}>Reportes</Text><Text style={s.muted}>Consulta ventas e ingresos por período.</Text></View><BusinessDate /></View>
    {reports.error && <LoadNotice message={reports.error} onRetry={() => void reports.reload()} />}
    <View style={s.card}><Text style={s.heading}>Resumen de hoy</Text>{reports.today ? <ReportDetails report={reports.today} period={{ desde: dateKey(), hasta: dateKey() }} /> : <Text style={s.muted}>{reports.loading ? 'Cargando reporte…' : 'El resumen de hoy no está disponible.'}</Text>}</View>
    <View style={s.card}>
      <Text style={s.heading}>Elegir un período</Text><Text style={s.muted}>Selecciona el primer y el último día. Ambos se incluyen en el reporte.</Text>
      <View style={s.row}>{presets.map(preset => {
        const next = analyticsPresetPeriod(preset.id), selected = next.desde === period.desde && next.hasta === period.hasta;
        return <Pressable key={preset.id} accessibilityRole="button" accessibilityLabel={`Ver ${preset.label.toLowerCase()}`} accessibilityState={{ selected }} onPress={() => changePeriod(next)} style={s.chip}><Text style={selected ? s.link : s.text}>{preset.label}</Text></Pressable>;
      })}</View>
      <View style={[s.row, { alignItems: 'flex-start' }]}><DatePicker style={{ flexGrow: 1, flexBasis: 220 }} label="Desde" value={period.desde} onChange={value => changeDate('desde', value)} /><DatePicker style={{ flexGrow: 1, flexBasis: 220 }} label="Hasta" value={period.hasta} minDate={period.desde} onChange={value => changeDate('hasta', value)} /></View>
      {invalid && <Text accessibilityRole="alert" style={s.link}>La fecha inicial no puede ser posterior a la final.</Text>}
      <Pressable accessibilityRole="button" disabled={!canGenerate} onPress={() => void reports.generate({ ...period })} style={[s.button, { alignSelf: 'flex-start', opacity: canGenerate ? 1 : 0.5 }]}><Text style={s.buttonText}>{reports.rangeLoading ? 'Generando…' : 'Generar reporte'}</Text></Pressable>
      {reports.rangeError && <Text accessibilityRole="alert" style={s.link}>{reports.rangeError}</Text>}
      {reports.result && <View style={{ gap: 16 }}><Text style={s.muted}>{formatDate(reports.result.period.desde)} — {formatDate(reports.result.period.hasta)}</Text><ReportDetails key={`${reports.result.period.desde}/${reports.result.period.hasta}`} report={reports.result.report} period={reports.result.period} /></View>}
    </View>
    <SalesAnalytics sales={analysis.sales} products={analysis.products} period={period} loading={analysis.loading} error={analysis.error} onRetry={analysis.reload} onChangePeriod={changePeriod} />
    <Text style={s.heading}>Reportes diarios</Text>
    {reports.daily.map((report, index) => <DailyReport key={report.fecha || index} report={report} />)}
    {!reports.daily.length && <LoadNotice message={reports.loading ? 'Cargando reportes diarios…' : reports.error ? 'Los reportes diarios no están disponibles.' : 'Todavía no hay reportes diarios.'} />}
  </ScrollView>;
}
