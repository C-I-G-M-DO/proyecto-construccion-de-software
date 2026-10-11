import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BrandMark, BusinessDate, Metric } from '@/components/business-ui';
import SalesAnalytics from '@/components/analytics/sales-analytics.web';
import DemoDialog, { DemoButton } from '@/components/demo/demo-dialog';
import DatePicker from '@/components/ui/date-picker';
import { categoryLabel } from '@/constants/product-categories';
import { useCompaniesDemo } from '@/hooks/use-companies-demo';
import { useResponsiveDimensions } from '@/hooks/use-responsive-dimensions';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { Campaign, DemoStore } from '@/types/companies';
import { businessTime } from '@/utils/analytics';
import { campaignStatus, createDemoStores, eligibleStores, validateCampaign } from '@/utils/companies-demo';
import { formatMoney } from '@/utils/currency';
import { dateKey, daysBetween, formatDate, parseDate } from '@/utils/dates';
import { normalizedText, productCategory } from '@/utils/product-categories';
import CampaignForm from './campaign-form.web';

const TABS = ['Panorama', 'Colmados', 'Campañas'] as const;
type Tab = typeof TABS[number];
function periodSales(store: DemoStore, desde: string, hasta: string) {
  return store.sales.filter(sale => {
    const time = businessTime(sale.createdAt);
    return time && time.day >= desde && time.day <= hasta;
  });
}

export default function CompaniesDemoScreen() {
  const s = useSurtioStyles(businessStyles), t = useSurtioTheme(), { width } = useResponsiveDimensions();
  const stores = useMemo(() => createDemoStores(), []);
  const { state, update, warning } = useCompaniesDemo(stores);
  const [tab, setTab] = useState<Tab>('Panorama'), [zone, setZone] = useState('todas'), [search, setSearch] = useState('');
  const [period, setPeriod] = useState(() => {
    const today = businessTime(new Date().toISOString())!.day, from = parseDate(today)!;
    from.setDate(from.getDate() - 29);
    return { desde: dateKey(from), hasta: today };
  });
  const [storeOpen, setStoreOpen] = useState<DemoStore | null>(null);
  const [campaignForm, setCampaignForm] = useState<Campaign | 'new' | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null), [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null), [error, setError] = useState<string | null>(null);
  const today = businessTime(new Date().toISOString())!.day;
  const zones = [...new Set(stores.map(store => store.zona))];
  const visibleStores = stores.filter(store => (zone === 'todas' || store.zona === zone) && normalizedText(store.nombre).includes(normalizedText(search)));
  const participants = stores.filter(store => store.estadisticasAutorizadas && (zone === 'todas' || store.zona === zone));
  const sales = participants.flatMap(store => periodSales(store, period.desde, period.hasta));
  const total = sales.reduce((sum, sale) => sum + sale.subtotal, 0);
  const invalidPeriod = (daysBetween(period.desde, period.hasta) ?? -1) < 0;
  const preview = state?.campaigns.find(campaign => campaign.id === previewId);
  const changeTab = (next: Tab) => { setTab(next); setNotice(null); setError(null); };
  function changeStatus(campaign: Campaign, status: Campaign['estado']) {
    const invalid = validateCampaign(campaign, stores);
    if (invalid) return setError(invalid);
    if (status === 'activa' && campaign.hasta < today) return setError('Actualiza la vigencia antes de activar esta campaña.');
    if (status === 'activa' && !eligibleStores(stores, campaign).length) return setError('La campaña necesita al menos un colmado elegible.');
    update(current => ({ ...current, campaigns: current.campaigns.map(item => item.id === campaign.id ? { ...item, estado: status } : item) }));
    setError(null); setNotice(status === 'activa' ? 'Campaña activada únicamente en esta demo.' : 'Campaña de prueba pausada.');
  }
  const selector = <View style={{ gap: 6, minWidth: 0, flexGrow: 1, flexBasis: 220 }}><Text style={s.label}>Zona del negocio</Text><select aria-label="Zona del negocio" value={zone} onChange={event => setZone(event.target.value)} style={{ minHeight: 48, borderRadius: 12, border: `1px solid ${t.border}`, padding: 12, color: t.text, background: t.card, width: '100%', fontSize: 15 }}><option value="todas">Todas las zonas</option>{zones.map(item => <option key={item}>{item}</option>)}</select></View>;
  if (!state) return <View style={s.page}><BrandMark size={64} /><Text style={s.heading}>Preparando Surtío Empresas…</Text></View>;

  return <View style={{ flex: 1, backgroundColor: t.background }}>
    <Head><title>Surtío Empresas · Demo</title><meta name="robots" content="noindex" /></Head>
    <ScrollView contentContainerStyle={[s.page, width < 700 && { padding: 16 }]}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <View style={[s.row, { flexWrap: 'nowrap', minWidth: 0, flexBasis: 300, flexGrow: 1, flexShrink: 1 }]}><BrandMark /><View style={{ gap: 4, flex: 1, minWidth: 0 }}><Text style={s.title}>Surtío Empresas</Text><Text style={s.muted}>Conoce la demanda y descubre oportunidades por zona.</Text></View></View>
        <DemoButton label="Volver a la demo del colmado" secondary onPress={() => router.replace('/demo')} />
      </View>
      <BusinessDate />
      <View style={[s.card, { borderColor: t.primary }]}><Text style={s.link}>DEMO · DATOS FICTICIOS</Text><Text style={s.text}>Este espacio simula el panel interno de Surtío. Las campañas y los intereses se guardan solo en este navegador. La publicación y el acceso a datos reales requieren el servidor y la autorización del negocio.</Text></View>
      {warning && <Text accessibilityRole="alert" style={s.muted}>{warning}</Text>}
      {notice && <Text accessibilityLiveRegion="polite" style={s.text}>{notice}</Text>}
      {error && <Text accessibilityRole="alert" style={s.link}>{error}</Text>}
      <View style={s.row}>{TABS.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: tab === item }} onPress={() => changeTab(item)} style={[s.chip, { backgroundColor: tab === item ? t.button : t.muted }]}><Text style={tab === item ? s.buttonText : s.text}>{item}</Text></Pressable>)}</View>
      {tab !== 'Campañas' && <View style={s.card}>
        <View style={s.row}>{selector}{tab === 'Panorama' ? <><View style={{ flexGrow: 1, flexBasis: 220 }}><DatePicker label="Analizar desde" value={period.desde} onChange={desde => setPeriod(current => ({ ...current, desde }))} /></View><View style={{ flexGrow: 1, flexBasis: 220 }}><DatePicker label="Analizar hasta" value={period.hasta} onChange={hasta => setPeriod(current => ({ ...current, hasta }))} /></View></> : <View style={{ flexGrow: 1, flexBasis: 220, gap: 6 }}><Text style={s.label}>Buscar colmado</Text><TextInput accessibilityLabel="Buscar colmado" style={s.input} value={search} onChangeText={setSearch} /></View>}</View>
      </View>}
      {tab === 'Panorama' && <>
        <View style={s.row}><Metric label="Colmados participantes" value={String(participants.length)} note="Autorización de estadísticas simulada" /><Metric label="Ventas registradas" value={invalidPeriod ? '—' : String(sales.length)} note="En el período y zona seleccionados" /><Metric label="Valor de las ventas" value={invalidPeriod ? '—' : formatMoney(total)} note="Muestra ficticia, sin descuentos" /></View>
        <SalesAnalytics sales={participants.flatMap(store => store.sales)} products={stores[0].products} period={period} demo />
        <View style={s.card}><Text style={s.heading}>Comparación por zona</Text><Text style={s.muted}>Solo participan colmados con autorización de estadísticas. Esta muestra no representa el mercado completo.</Text>
          {zones.filter(item => zone === 'todas' || item === zone).map(item => {
            const group = participants.filter(store => store.zona === item), zoneSales = group.flatMap(store => periodSales(store, period.desde, period.hasta));
            return <View key={item} style={[s.row, { justifyContent: 'space-between', borderTopWidth: 1, borderColor: t.border, paddingTop: 12 }]}><View style={{ gap: 4 }}><Text style={s.text}>{item}</Text><Text style={s.muted}>{group.length} colmados participantes</Text></View><Text style={s.heading}>{invalidPeriod ? '—' : formatMoney(zoneSales.reduce((sum, sale) => sum + sale.subtotal, 0))}</Text></View>;
          })}
        </View>
      </>}
      {tab === 'Colmados' && <>
        <Text style={s.heading}>{visibleStores.length} colmados de prueba</Text>
        {!visibleStores.length && <Text style={s.muted}>No hay colmados con esos filtros.</Text>}
        {visibleStores.map(store => <View key={store.id} style={s.card}><View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ gap: 5, flexShrink: 1 }}><Text style={s.heading}>{store.nombre}</Text><Text style={s.muted}>{store.zona}</Text></View><DemoButton label={`Ver ficha de ${store.nombre}`} secondary onPress={() => setStoreOpen(store)} /></View><Text style={s.muted}>Estadísticas: {store.estadisticasAutorizadas ? 'autorizadas' : 'sin autorización'} · Promociones: {store.promocionesAutorizadas ? 'autorizadas' : 'sin autorización'}</Text></View>)}
      </>}
      {tab === 'Campañas' && <>
        <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.heading}>Promociones patrocinadas</Text><DemoButton label="Nueva campaña de prueba" onPress={() => setCampaignForm('new')} /></View>
        {!state.campaigns.length && <View style={s.card}><Text style={s.heading}>Crea tu primera campaña</Text><Text style={s.muted}>Elige un producto, la zona, el público y la vigencia. Puedes revisar cómo se vería para el colmadero.</Text></View>}
        {state.campaigns.map(campaign => <View key={campaign.id} style={s.card}>
          <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={[s.heading, { flexShrink: 1 }]}>{campaign.titulo}</Text><Text style={s.link}>{campaignStatus(campaign, today)}</Text></View>
          <Text style={s.text}>{campaign.patrocinador} · {stores[0].products.find(product => product._id === campaign.productoId)?.nombre}</Text>
          <Text style={s.muted}>{campaign.zona === 'todas' ? 'Todas las zonas' : campaign.zona} · {campaign.categoriaAudiencia === 'todos' ? 'Todas las categorías' : categoryLabel(campaign.categoriaAudiencia)}</Text>
          <Text style={s.muted}>{formatDate(campaign.desde)} – {formatDate(campaign.hasta)} · {eligibleStores(stores, campaign).length} colmados elegibles</Text>
          <Text style={s.muted}>{state.interests.includes(campaign.id) ? '1 interés de prueba en este navegador' : 'Sin intereses de prueba registrados'}</Text>
          <View style={s.row}><DemoButton label={`Vista previa de ${campaign.titulo}`} secondary onPress={() => setPreviewId(campaign.id)} /><DemoButton label={`Editar ${campaign.titulo}`} secondary onPress={() => setCampaignForm(campaign)} />{campaign.estado === 'activa' ? <DemoButton label={`Pausar ${campaign.titulo}`} secondary onPress={() => changeStatus(campaign, 'pausada')} /> : <DemoButton label={`Activar ${campaign.titulo}`} onPress={() => changeStatus(campaign, 'activa')} />}</View>
        </View>)}
      </>}
      <DemoButton label="Restablecer campañas de prueba" secondary onPress={() => setResetOpen(true)} />
    </ScrollView>
    {storeOpen && <DemoDialog title={storeOpen.nombre} onClose={() => setStoreOpen(null)}>
      <Text style={s.muted}>{storeOpen.zona} · Colmado ficticio</Text>
      {!storeOpen.estadisticasAutorizadas ? <Text style={s.text}>Este negocio no ha autorizado estadísticas. Su inventario y sus ventas no se muestran en el panel.</Text> : <>
        <Text style={s.label}>Período: {formatDate(period.desde)} – {formatDate(period.hasta)}</Text>
        <Metric label="Ventas del período" value={invalidPeriod ? '—' : String(periodSales(storeOpen, period.desde, period.hasta).length)} />
        <Metric label="Valor de las ventas" value={invalidPeriod ? '—' : formatMoney(periodSales(storeOpen, period.desde, period.hasta).reduce((sum, sale) => sum + sale.subtotal, 0))} />
        <Text style={s.heading}>Inventario actual</Text><Text style={s.muted}>El stock actual no permite reconstruir qué días hubo escasez.</Text>
        {storeOpen.products.map(product => <View key={product._id} style={{ gap: 4, borderTopWidth: 1, borderColor: t.border, paddingTop: 12 }}><Text style={s.text}>{product.nombre}</Text><Text style={s.muted}>{categoryLabel(productCategory(product))} · {product.stock} {product.unidadStock === 'libra' ? 'lb' : 'unidades'} disponibles</Text></View>)}
      </>}
    </DemoDialog>}
    {campaignForm && <CampaignForm stores={stores} today={today} campaign={campaignForm === 'new' ? undefined : campaignForm} onClose={() => setCampaignForm(null)} onSave={campaign => {
      update(current => ({ ...current, campaigns: [...current.campaigns.filter(item => item.id !== campaign.id), campaign] }));
      setCampaignForm(null); setError(null); setNotice('Campaña de prueba guardada.');
    }} />}
    {preview && <DemoDialog title="Vista previa para el colmadero" onClose={() => setPreviewId(null)}>
      <View style={[s.card, { borderColor: t.primary }]}><Text style={s.link}>PATROCINADO · DEMO</Text><Text style={s.heading}>{preview.titulo}</Text><Text style={s.label}>{preview.patrocinador}</Text><Text style={s.text}>{stores[0].products.find(product => product._id === preview.productoId)?.nombre}</Text><Text style={s.muted}>{preview.descripcion}</Text><DemoButton label={state.interests.includes(preview.id) ? 'Interés de prueba registrado' : 'Me interesa · Demo'} disabled={state.interests.includes(preview.id)} onPress={() => update(current => ({ ...current, interests: [...new Set([...current.interests, preview.id])] }))} /></View>
      <Text style={s.muted}>Es una vista previa. No publica anuncios ni contacta a empresas.</Text>
    </DemoDialog>}
    {resetOpen && <DemoDialog title="Restablecer campañas de prueba" onClose={() => setResetOpen(false)}><Text style={s.text}>Se eliminarán las campañas y los intereses de prueba de este navegador. Los productos y las ventas de la demo del colmado se conservan.</Text><DemoButton label="Confirmar restablecimiento de campañas" onPress={() => { update(() => ({ version: 1, campaigns: [], interests: [] })); setResetOpen(false); setNotice('Campañas de prueba restablecidas.'); setError(null); }} /></DemoDialog>}
  </View>;
}
