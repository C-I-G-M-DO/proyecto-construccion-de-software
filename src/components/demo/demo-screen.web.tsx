import { useState } from 'react';
import Head from 'expo-router/head';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BrandMark, BusinessDate, Metric } from '@/components/business-ui';
import ExpiryCard from '@/components/expiry-card';
import ReportDetails from '@/components/report-details.web';
import SaleCard from '@/components/sale-card';
import DatePicker from '@/components/ui/date-picker';
import { nombreMedida } from '@/constants/measures';
import { useDemo } from '@/hooks/use-demo';
import { useResponsiveDimensions } from '@/hooks/use-responsive-dimensions';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { DemoDraftLine, DemoState } from '@/types/demo';
import type { Producto } from '@/types/products';
import type { HistoryFilters } from '@/types/sales';
import { formatMoney } from '@/utils/currency';
import { dateKey } from '@/utils/dates';
import { createDemoState, demoAvailable, demoReport, dispatchDemoOrder, prepareDemoOrder } from '@/utils/demo';
import { expiryAlerts } from '@/utils/expiry';
import { amountError, filterSales, INITIAL_FILTERS } from '@/utils/history';
import DemoDialog, { DemoButton } from './demo-dialog';
import DemoProductForm from './demo-product-form.web';
import SalesAnalytics from '@/components/analytics/sales-analytics.web';
import { ProductCategoryFilter } from '@/components/product-category-controls';
import type { ProductCategory } from '@/constants/product-categories';
import { filterProducts } from '@/utils/product-categories';
import { router } from 'expo-router';

const TABS = ['Inicio', 'Productos', 'Historial', 'Alertas', 'Reportes'] as const;
type Tab = typeof TABS[number];

export default function DemoScreen() {
  const s = useSurtioStyles(businessStyles), t = useSurtioTheme(), { width } = useResponsiveDimensions();
  const { state, update, storageWarning } = useDemo();
  const [tab, setTab] = useState<Tab>('Inicio');
  const [category, setCategory] = useState<ProductCategory | 'todos'>('todos'), [productSearch, setProductSearch] = useState('');
  const [draft, setDraft] = useState<DemoDraftLine[]>([]);
  const [productForm, setProductForm] = useState<Producto | 'new' | null>(null);
  const [orderOpen, setOrderOpen] = useState(false), [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null), [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>({ ...INITIAL_FILTERS });
  const [expiryFilter, setExpiryFilter] = useState<'alertas' | 'vencido' | 'pronto' | 'vigente'>('alertas');
  const [period, setPeriod] = useState({ desde: '', hasta: '' });
  const today = dateKey(), effectivePeriod = { desde: period.desde || today, hasta: period.hasta || today };
  const wide = width >= 1000;
  function go(next: Tab) { setTab(next); setNotice(null); setError(null); }
  function act(change: (value: DemoState) => DemoState, success: () => void) {
    try { update(change); setError(null); success(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos completar la operación.'); }
  }
  const input = (label: string, value: string, onChange: (value: string) => void, numeric = false) => <View style={{ flexBasis: 180, flexGrow: 1, gap: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} style={s.input} keyboardType={numeric ? 'decimal-pad' : 'default'} maxLength={numeric ? 12 : 100} /></View>;
  const chip = (label: string, selected: boolean, action: () => void) => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected }} onPress={action} style={[s.chip, { backgroundColor: selected ? t.button : t.muted }]}><Text style={selected ? s.buttonText : s.text}>{label}</Text></Pressable>;
  if (!state) return <View style={[s.page, { flex: 1, justifyContent: 'center' }]}><BrandMark size={64} /><Text style={s.heading}>Preparando la demo de Surtío…</Text></View>;
  const alerts = expiryAlerts(state.products), activeAlerts = alerts.filter(item => item.estado !== 'vigente');
  const todayReport = demoReport(state, { desde: today, hasta: today });
  const selectedSales = filterSales(state.sales, filters);
  const draftDetails = draft.map(line => {
    const product = state.products.find(item => item._id === line.productoId)!;
    return { ...line, nombre: product.nombre, precio: product.precios.find(item => item.tipo === line.tipo)!.valor };
  });
  const draftTotal = draftDetails.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const changeFilter = (key: keyof HistoryFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const add = (product: Producto, line: DemoDraftLine) => {
    const next = [...draft], index = next.findIndex(item => item.productoId === line.productoId && item.tipo === line.tipo);
    if (index < 0) next.push(line); else next[index] = { ...next[index], cantidad: next[index].cantidad + 1 };
    try { prepareDemoOrder(state, next); setDraft(next); setError(null); setNotice(`${product.nombre} agregado a la orden.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Revisa la orden.'); }
  };
  return <View style={{ flex: 1, backgroundColor: t.background }}>
    <Head><title>Surtío · Demo interactiva</title><meta name="description" content="Prueba Surtío con datos ficticios: productos, despacho, historial y alertas." /><meta name="robots" content="noindex" /></Head>
    <View style={{ borderBottomWidth: 1, borderColor: t.border, backgroundColor: t.card }}><View style={[s.page, s.row, { paddingVertical: 16, paddingBottom: 16, justifyContent: 'space-between' }]}>
      <View style={[s.row, { flexWrap: 'nowrap' }]}><BrandMark /><View style={{ gap: 3 }}><Text style={s.heading}>Surtío</Text><Text style={s.muted}>Colmado La Esquina · Demo</Text></View></View>
      <DemoButton label="Restablecer demo" secondary onPress={() => setResetOpen(true)} />
      <DemoButton label="Surtío Empresas · Demo" secondary onPress={() => router.push('/demo-empresas')} />
    </View></View>
    <View style={[s.page, { flex: 1, flexDirection: wide ? 'row' : 'column', padding: width < 600 ? 16 : 24, paddingBottom: 0, gap: 20 }]}>
      <View style={[s.card, { padding: 12, gap: 6, width: wide ? 200 : '100%', alignSelf: 'flex-start', flexDirection: wide ? 'column' : 'row', flexWrap: 'wrap' }]}>
        {TABS.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: tab === item }} onPress={() => go(item)} style={{ minHeight: 48, padding: 12, borderRadius: 12, backgroundColor: tab === item ? t.button : 'transparent' }}><Text style={tab === item ? s.buttonText : s.text}>{item}{item === 'Alertas' && activeAlerts.length ? ` (${activeAlerts.length})` : ''}</Text></Pressable>)}
      </View>
      <ScrollView key={tab} style={{ flex: 1, minWidth: 0 }} contentContainerStyle={{ gap: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={[s.card, { backgroundColor: t.tint, padding: 14, gap: 4 }]}><Text style={s.link}>DEMO · DATOS FICTICIOS</Text><Text style={s.muted}>Prueba libremente. Tus cambios se guardan solo en este navegador.</Text></View>
        {storageWarning && <Text accessibilityLiveRegion="polite" style={s.muted}>{storageWarning}</Text>}
        {notice && <Text accessibilityLiveRegion="polite" style={s.link}>{notice}</Text>}
        {error && <Text accessibilityRole="alert" style={s.link}>{error}</Text>}
        <View style={[s.row, { justifyContent: 'space-between' }]}><Text accessibilityRole="header" style={s.title}>{tab === 'Inicio' ? '¡Dímelo, José! 👋' : tab}</Text><BusinessDate /></View>
        {tab === 'Inicio' && <>
          <Text style={s.muted}>Administra el colmado y prueba una operación completa.</Text>
          <View style={s.row}><Metric label="Ventas de hoy" value={formatMoney(todayReport.ingresos!)} note={`${todayReport.cantidadVentas} ventas despachadas`} /><Metric label="Productos registrados" value={String(state.products.length)} /><Metric label="Alertas de vencimiento" value={String(activeAlerts.length)} note="Revisa los lotes antes de vender" /></View>
          <View style={s.card}><Text style={s.heading}>Prueba Surtío en tres pasos</Text><Text style={s.text}>1. Agrega un producto o elige uno del catálogo.</Text><Text style={s.text}>2. Prepara una orden y confirma el despacho.</Text><Text style={s.text}>3. Consulta la venta en Historial y el resumen en Reportes.</Text><View style={s.row}><DemoButton label="Probar una venta" onPress={() => go('Productos')} /><DemoButton label="Ver alertas" secondary onPress={() => go('Alertas')} /></View></View>
        </>}
        {tab === 'Productos' && <>
          <View style={s.row}><DemoButton label="Nuevo producto" onPress={() => { setError(null); setProductForm('new'); }} />{state.pending && <DemoButton label="Ver orden pendiente" secondary onPress={() => { setError(null); setOrderOpen(true); }} />}</View>
          <View style={[s.card, { borderColor: t.primary }]}><Text style={s.heading}>Preparar orden</Text>
            {state.pending ? <Text style={s.muted}>Hay una orden pendiente de despacho. Confírmala o cancélala antes de preparar otra.</Text> : <>
              {!draftDetails.length && <Text style={s.muted}>Elige una presentación del catálogo para agregarla.</Text>}
              {draftDetails.map((item, index) => <View key={`${item.productoId}/${item.tipo}`} style={{ gap: 8 }}><Text style={s.text}>{item.nombre} · {nombreMedida(item.tipo)} · {formatMoney(item.precio)}</Text><View style={[s.row, { flexWrap: 'nowrap' }]}><TextInput accessibilityLabel={`Cantidad de ${item.nombre} ${nombreMedida(item.tipo)}`} keyboardType="number-pad" value={String(item.cantidad)} style={[s.input, { flex: 1 }]} maxLength={6} onChangeText={value => setDraft(current => current.map((line, i) => i === index ? { ...line, cantidad: Number(value) } : line))} /><DemoButton label={`Quitar ${item.nombre}`} secondary onPress={() => setDraft(current => current.filter((_, i) => i !== index))} /></View></View>)}
              <Text style={s.heading}>Total: {formatMoney(draftTotal)}</Text><DemoButton label="Enviar a despacho" disabled={!draft.length} onPress={() => act(value => prepareDemoOrder(value, draft), () => { setDraft([]); setNotice(null); setOrderOpen(true); })} />
            </>}
          </View>
          <View style={s.card}><ProductCategoryFilter products={state.products} value={category} onChange={setCategory} /><TextInput accessibilityLabel="Buscar producto del catálogo" placeholder="Buscar producto…" placeholderTextColor={t.secondary} value={productSearch} onChangeText={setProductSearch} style={s.input} /><Text style={s.muted}>{filterProducts(state.products, category, productSearch).length} productos encontrados</Text>{(category !== 'todos' || productSearch) && <DemoButton label="Limpiar categorías y búsqueda" secondary onPress={() => { setCategory('todos'); setProductSearch(''); }} />}</View>
          {filterProducts(state.products, category, productSearch).map(product => <View key={product._id} style={s.card}><View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1, gap: 6 }}><Text style={s.heading}>{product.nombre}</Text><Text style={s.muted}>{product.stock} {product.unidadStock === 'libra' ? 'lb' : 'unidades'} en stock · {demoAvailable(product)} disponibles para venta</Text></View><DemoButton label={`Editar ${product.nombre}`} secondary disabled={!!state.pending} onPress={() => setProductForm(product)} /></View><View style={s.row}>{product.precios.map(price => <DemoButton key={price.tipo} label={`Agregar ${product.nombre} · ${nombreMedida(price.tipo)} · ${formatMoney(price.valor)}`} disabled={!!state.pending || demoAvailable(product) <= 0} onPress={() => add(product, { productoId: product._id, tipo: price.tipo, cantidad: 1 })} />)}</View></View>)}
        </>}
        {tab === 'Historial' && <>
          <View style={s.card}><Text style={s.heading}>Buscar ventas</Text><View style={s.row}>{(['todos', 'dia', 'semana', 'mes'] as const).map((value, index) => chip(['Todos', 'Hoy', 'Esta semana', 'Este mes'][index], filters.periodo === value, () => changeFilter('periodo', value)))}</View><View style={s.row}>{input('Número de orden', filters.orden, value => changeFilter('orden', value))}{input('Producto', filters.producto, value => changeFilter('producto', value))}</View><View style={s.row}>{input('Monto mínimo (RD$)', filters.montoMin, value => changeFilter('montoMin', value), true)}{input('Monto máximo (RD$)', filters.montoMax, value => changeFilter('montoMax', value), true)}</View>{amountError(filters) && <Text accessibilityRole="alert" style={s.link}>{amountError(filters)}</Text>}<DemoButton label="Restablecer filtros" secondary onPress={() => setFilters({ ...INITIAL_FILTERS })} /></View>
          <Text style={s.muted}>{selectedSales.length} ventas encontradas</Text>{!selectedSales.length && <Text style={s.text}>No hay ventas para estos filtros.</Text>}{selectedSales.map(sale => <SaleCard key={sale._id} sale={sale} latest={sale._id === state.sales[0]?._id} />)}
        </>}
        {tab === 'Alertas' && <>
          <Text style={s.muted}>Lotes vencidos o que vencen en los próximos siete días.</Text><View style={s.row}>{(['alertas', 'vencido', 'pronto', 'vigente'] as const).map((value, index) => chip(['Todas las alertas', 'Vencidos', 'Por vencer', 'Sin alertas'][index], expiryFilter === value, () => setExpiryFilter(value)))}</View>
          {alerts.filter(item => expiryFilter === 'alertas' ? item.estado !== 'vigente' : item.estado === expiryFilter).map(alert => <ExpiryCard key={alert.id} alert={alert} />)}
          {!alerts.some(item => expiryFilter === 'alertas' ? item.estado !== 'vigente' : item.estado === expiryFilter) && <Text style={s.text}>No hay lotes en este grupo.</Text>}
          <Text style={s.muted}>{state.products.filter(item => !item.lotes?.length).length} productos sin fecha de vencimiento registrada.</Text>
        </>}
        {tab === 'Reportes' && <>
          <View style={s.card}><Text style={s.heading}>Elegir un período</Text><View style={[s.row, { alignItems: 'flex-start' }]}><DatePicker label="Desde" style={{ flexGrow: 1, flexBasis: 200 }} value={effectivePeriod.desde} onChange={value => setPeriod(current => ({ ...current, desde: value }))} /><DatePicker label="Hasta" style={{ flexGrow: 1, flexBasis: 200 }} value={effectivePeriod.hasta} minDate={effectivePeriod.desde} onChange={value => setPeriod(current => ({ ...current, hasta: value }))} /></View><DemoButton label="Ver últimos 7 días" secondary onPress={() => { const start = new Date(); start.setDate(start.getDate() - 6); setPeriod({ desde: dateKey(start), hasta: today }); }} />
            {effectivePeriod.desde > effectivePeriod.hasta ? <Text accessibilityRole="alert" style={s.link}>La fecha inicial no puede ser posterior a la final.</Text> : <ReportDetails demo report={demoReport(state, effectivePeriod)} period={effectivePeriod} />}
          </View>
          <SalesAnalytics demo sales={state.sales} products={state.products} period={effectivePeriod} />
        </>}
      </ScrollView>
    </View>
    {productForm && <DemoProductForm product={productForm === 'new' ? undefined : productForm} onClose={() => setProductForm(null)} onSave={product => act(value => ({ ...value, products: value.products.some(item => item._id === product._id) ? value.products.map(item => item._id === product._id ? product : item) : [...value.products, product] }), () => { setProductForm(null); setNotice('Producto guardado en la demo.'); })} />}
    {orderOpen && state.pending && <DemoDialog title="Detalles de la orden" onClose={() => setOrderOpen(false)}><Text style={s.muted}>La venta se registra al confirmar el despacho.</Text>{state.pending.map(item => <View key={item.id} style={{ gap: 4 }}><Text style={s.text}>{item.nombre} · {nombreMedida(item.tipo)}</Text><Text style={s.muted}>{item.cantidad} × {formatMoney(item.precio)} = {formatMoney(item.total)}</Text></View>)}<Text style={s.heading}>Total: {formatMoney(state.pending.reduce((sum, item) => sum + item.total, 0))}</Text>{error && <Text accessibilityRole="alert" style={s.link}>{error}</Text>}<DemoButton label="Confirmar despacho" onPress={() => act(value => dispatchDemoOrder(value), () => { setOrderOpen(false); setTab('Historial'); setNotice('Venta registrada. Las existencias y el reporte se actualizaron.'); })} /><DemoButton label="Cancelar orden" secondary onPress={() => act(value => ({ ...value, pending: null }), () => { setOrderOpen(false); setNotice('Orden cancelada. Las existencias se conservaron.'); })} /></DemoDialog>}
    {resetOpen && <DemoDialog title="Restablecer datos de prueba" onClose={() => setResetOpen(false)}><Text style={s.text}>Se eliminarán únicamente los productos, órdenes y ventas que probaste en esta demo. Volverán los ejemplos iniciales.</Text><DemoButton label="Sí, restablecer datos ficticios" onPress={() => act(() => createDemoState(), () => { setResetOpen(false); setOrderOpen(false); setProductForm(null); setDraft([]); setCategory('todos'); setProductSearch(''); setFilters({ ...INITIAL_FILTERS }); setPeriod({ desde: '', hasta: '' }); setTab('Inicio'); setNotice('Demo restablecida.'); })} /></DemoDialog>}
  </View>;
}
