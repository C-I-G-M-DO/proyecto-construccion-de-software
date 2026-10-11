import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PRODUCT_CATEGORIES } from '@/constants/product-categories';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { Producto } from '@/types/products';
import type { Venta } from '@/types/sales';
import type { ReportPeriod } from '@/types/reports';
import type { AnalyticsFilters, DemandPoint } from '@/types/analytics';
import { analyzeSales, analyticsEmptyMessage, analyticsPresetPeriod } from '@/utils/analytics';
import { formatMoney } from '@/utils/currency';
import { formatDate } from '@/utils/dates';

function DemandChart({ points, monetary }: { points: DemandPoint[]; monetary: boolean }) {
  const t = useSurtioTheme(), s = useSurtioStyles(businessStyles);
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...points.map(point => point.valor));
  const x = (index: number) => 52 + index * 680 / Math.max(1, points.length - 1), y = (value: number) => 215 - value / max * 175;
  const format = (value: number) => monetary ? formatMoney(value) : value.toLocaleString('es-DO', { maximumFractionDigits: 3 });
  const selected = points.find(point => point.id === hover) ?? [...points].sort((a, b) => b.valor - a.valor)[0];
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(index)},${y(point.valor)}`).join(' ');
  if (!points.length) return <Text style={s.muted}>No hay datos para este período.</Text>;
  return <View style={{ gap: 12 }}>
    <svg viewBox="0 0 780 270" role="group" aria-label="Patrón de ventas. Selecciona un punto para consultar su valor." style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 300 }}>
      {[0, .5, 1].map(fraction => <g key={fraction}><line x1="52" x2="742" y1={y(max * fraction)} y2={y(max * fraction)} stroke={t.border} /><text x="45" y={y(max * fraction) + 4} fill={t.secondary} textAnchor="end" fontSize="11">{Math.round(max * fraction).toLocaleString('es-DO')}</text></g>)}
      {points.length > 1 && <path d={`${path} L${x(points.length - 1)},215 L52,215 Z`} fill={t.primary} opacity=".09" />}
      <path d={path} fill="none" stroke={t.primary} strokeWidth="3" />
      {points.map((point, index) => <g key={point.id}>
        <circle cx={x(index)} cy={y(point.valor)} r={point.id === selected?.id ? 6 : 4} fill={t.primary} />
        <circle cx={x(index)} cy={y(point.valor)} r="13" fill="transparent" tabIndex={0} role="button" aria-label={`${point.label}: ${format(point.valor)}`} onMouseEnter={() => setHover(point.id)} onFocus={() => setHover(point.id)} onClick={() => setHover(point.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setHover(point.id); } }} />
        {(index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 6) === 0) && <text x={x(index)} y="250" textAnchor="middle" fill={t.secondary} fontSize="12">{point.label}</text>}
      </g>)}
    </svg>
    {selected && <View style={{ backgroundColor: t.muted, borderRadius: 12, padding: 12, gap: 4 }}><Text style={s.text}>{selected.label} · {format(selected.valor)}</Text><Text style={s.muted}>Total registrado: {format(selected.total)} · {selected.dias} día{selected.dias === 1 ? '' : 's'} del período</Text></View>}
  </View>;
}

export default function SalesAnalytics({ sales, products, period, demo = false, loading = false, error, onRetry, onChangePeriod }: { sales: Venta[]; products: Producto[]; period: ReportPeriod; demo?: boolean; loading?: boolean; error?: string | null; onRetry?: () => void; onChangePeriod?: (period: ReportPeriod) => void }) {
  const s = useSurtioStyles(businessStyles), t = useSurtioTheme();
  const [options, setOptions] = useState<Omit<AnalyticsFilters, keyof ReportPeriod>>({ productoId: '', categoria: 'todos', metrica: 'importe', agrupacion: 'dia', ranking: 'mas' });
  const filters = { ...options, ...period };
  const result = useMemo(() => analyzeSales(sales, products, filters), [sales, products, period.desde, period.hasta, options]);
  const selectStyle = { width: '100%', minHeight: 46, padding: 10, color: t.text, background: t.background, border: `1px solid ${t.border}`, borderRadius: 10, fontSize: 14 };
  const select = (label: string, key: keyof typeof options, choices: { value: string; label: string }[]) => <View style={{ flexGrow: 1, flexBasis: 160, gap: 6 }}><Text style={s.label}>{label}</Text><select aria-label={label} value={options[key]} style={selectStyle} onChange={event => setOptions(current => ({ ...current, [key]: event.target.value, ...(key === 'categoria' || key === 'metrica' ? { productoId: '' } : {}) }))}>{choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></View>;
  const monetary = options.metrica === 'importe';
  const format = (value: number) => monetary ? formatMoney(value) : `${value.toLocaleString('es-DO', { maximumFractionDigits: 3 })} ${options.metrica === 'libras' ? 'lb' : 'unid.'}`;
  const top = result.ranking.slice(0, 10), max = Math.max(1, ...top.map(row => row.valor));
  const selected = result.ranking.find(row => row.id === options.productoId);
  const selectedName = selected?.nombre ?? (options.productoId ? products.find(product => product._id === options.productoId)?.nombre ?? 'Producto seleccionado sin ventas' : 'Todos los productos');
  const emptyMessage = analyticsEmptyMessage(result, period);
  const resetFilters = () => setOptions(current => ({ ...current, categoria: 'todos', metrica: 'importe', productoId: '' }));
  return <View style={{ gap: 18 }}>
    <View style={s.card}><Text accessibilityRole="header" style={s.heading}>Análisis de ventas</Text><Text style={s.muted}>Compara productos y descubre cuándo tienen más demanda.</Text>
      <Text style={s.label}>Período: {formatDate(period.desde)} — {formatDate(period.hasta)}</Text>
      <View style={s.row}>{select('Medir por', 'metrica', [{ value: 'importe', label: 'Valor vendido (RD$)' }, { value: 'unidades', label: 'Cantidad en unidades' }, { value: 'libras', label: 'Cantidad en libras' }])}{select('Categoría del análisis', 'categoria', [{ value: 'todos', label: 'Todas las categorías' }, ...PRODUCT_CATEGORIES.map(item => ({ value: item.id, label: item.label }))])}{select('Orden del ranking', 'ranking', [{ value: 'mas', label: 'Más vendidos' }, { value: 'menos', label: 'Menos vendidos' }])}</View>
      <Text style={s.muted}>{loading ? 'Consultando ventas…' : `${demo ? 'Datos ficticios' : 'Registros disponibles'} · ${result.ventasDisponibles} ventas en el período. El ranking incluye productos con ventas registradas.`}</Text>
      <View style={s.row}>{select('Agrupar demanda', 'agrupacion', [{ value: 'dia', label: 'Por fecha' }, { value: 'diaSemana', label: 'Por día de semana' }, { value: 'hora', label: 'Por hora' }])}</View>
      {monetary && <Text style={s.muted}>Importes de productos antes de descuentos. El resumen del reporte muestra los ingresos cobrados.</Text>}
      {result.lineasOmitidas > 0 && <Text style={s.muted}>{result.lineasOmitidas} líneas no tienen datos suficientes para esta medida.</Text>}
      {!loading && !error && result.ventasSinDetalle > 0 && <Text style={s.muted}>{result.ventasSinDetalle} ventas no incluyen el detalle de productos.</Text>}
      {!loading && !error && result.ventasFechaInvalida > 0 && <Text style={s.muted}>{result.ventasFechaInvalida} ventas no pudieron ubicarse por fecha.</Text>}
    </View>
    {loading ? <View style={s.card}><Text style={s.muted}>Cargando datos para las gráficas…</Text></View> : error ? <View style={s.card}><Text accessibilityRole="alert" style={s.muted}>{error}</Text>{onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={s.button}><Text style={s.buttonText}>Reintentar análisis</Text></Pressable>}</View> : result.error ? <View style={s.card}><Text accessibilityRole="alert" style={s.link}>{result.error}</Text></View> : <>
      <View style={s.card}><Text style={s.heading}>{options.ranking === 'mas' ? 'Productos más vendidos' : 'Productos menos vendidos'}</Text><Text style={s.muted}>Selecciona un producto para ver su patrón de demanda.</Text>
        {!top.length && <>
          <Text style={s.text}>{emptyMessage}</Text>
          {!!result.ventasFueraPeriodo && !result.ventasDisponibles && result.ultimaVenta && onChangePeriod && <Pressable accessibilityRole="button" onPress={() => onChangePeriod(analyticsPresetPeriod('ultimos30', result.ultimaVenta!))} style={[s.button, { alignSelf: 'flex-start' }]}><Text style={s.buttonText}>Ver período de la última venta</Text></Pressable>}
          {!!result.ventasDisponibles && (options.categoria !== 'todos' || options.metrica !== 'importe') && <Pressable accessibilityRole="button" onPress={resetFilters} style={[s.button, { alignSelf: 'flex-start' }]}><Text style={s.buttonText}>Restablecer filtros del análisis</Text></Pressable>}
          {!!result.ventasDisponibles && !!result.ventasSinDetalle && onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={[s.chip, { alignSelf: 'flex-start' }]}><Text style={s.link}>Actualizar datos de ventas</Text></Pressable>}
        </>}
        {top.map(row => <Pressable key={row.id} accessibilityRole="button" accessibilityLabel={`Analizar ${row.nombre}`} accessibilityState={{ selected: options.productoId === row.id }} onPress={() => setOptions(current => ({ ...current, productoId: current.productoId === row.id ? '' : row.id }))} style={{ gap: 8, minHeight: 58, padding: 10, borderRadius: 10, backgroundColor: options.productoId === row.id ? t.tint : 'transparent', borderWidth: 1, borderColor: options.productoId === row.id ? t.primary : 'transparent' }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.text, { flex: 1 }]}>{row.nombre}</Text><Text style={s.label}>{format(row.valor)}</Text></View><View style={{ height: 9, borderRadius: 6, backgroundColor: t.muted }}><View style={{ height: 9, width: `${row.valor / max * 100}%`, backgroundColor: t.primary, borderRadius: 6 }} /></View></Pressable>)}
      </View>
      <View style={s.card}><Text style={s.heading}>Cuándo se vende · {selectedName}</Text>
        <View style={s.row}>{select('Producto del patrón', 'productoId', [{ value: '', label: 'Todos los productos' }, ...result.ranking.map(row => ({ value: row.id, label: row.nombre })), ...(options.productoId && !selected ? [{ value: options.productoId, label: selectedName }] : [])])}</View>
        <Text style={s.muted}>{options.agrupacion === 'dia' ? 'Total registrado por fecha' : 'Promedio por día del período, usando los registros disponibles'} · Hora de República Dominicana</Text>
        {!result.ranking.length ? <Text style={s.text}>El patrón aparecerá cuando haya ventas con detalle que coincidan con el período y los filtros de arriba.</Text> : options.productoId && !selected ? <View style={{ gap: 12 }}><Text style={s.text}>El producto seleccionado no tiene ventas para este período y estos filtros.</Text><Pressable accessibilityRole="button" onPress={() => setOptions(current => ({ ...current, productoId: '' }))} style={[s.chip, { alignSelf: 'flex-start' }]}><Text style={s.link}>Ver todos los productos del patrón</Text></Pressable></View> : <DemandChart key={`${options.productoId}/${options.agrupacion}/${options.metrica}/${period.desde}/${period.hasta}`} points={result.series} monetary={monetary} />}
      </View>
    </>}
  </View>;
}
