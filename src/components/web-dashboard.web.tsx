import Ionicons from '@/components/ui/business-icon';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { BusinessDate, LoadNotice, Metric } from '@/components/business-ui';
import { readSessionProfile, type SessionProfile } from '@/hooks/session-profile';
import { useFocusedList } from '@/hooks/use-focused-list';
import { useCurrentDay } from '@/hooks/use-current-day';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { Venta } from '@/types/sales';
import type { Producto } from '@/types/products';
import { dateKey } from '@/utils/dates';
import { formatMoney } from '@/utils/currency';
import { saleTotal } from '@/utils/history';

export default function WebDashboard() {
  const t = useSurtioTheme(), s = useSurtioStyles(businessStyles), now = useCurrentDay();
  const sales = useFocusedList<Venta>('sales'), products = useFocusedList<Producto>('products');
  const [profile, setProfile] = useState<SessionProfile>({});
  useFocusEffect(useCallback(() => {
    let active = true;
    void readSessionProfile().then(value => { if (active) setProfile(value); }).catch(() => {});
    return () => { active = false; };
  }, []));
  const today = now ? sales.data.filter(sale => dateKey(new Date(sale.createdAt)) === dateKey(now)) : [];
  const refresh = () => { void sales.reload(); void products.reload(); };
  const greeting = !now ? 'Bienvenido' : now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={sales.loading || products.loading} onRefresh={refresh} />}>
    <View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ gap: 8 }}><Text style={s.title}>{greeting}, {profile.name?.trim().split(/\s+/)[0] || 'José'}</Text><Text style={s.muted}>Aquí tienes un resumen de tu negocio.</Text></View><BusinessDate /></View>
    <View style={s.row}>
      <Metric label="Ventas de hoy" value={sales.loading || sales.error ? '—' : formatMoney(today.reduce((sum, sale) => sum + saleTotal(sale), 0))} note={sales.error ? 'No se pudieron consultar' : `${today.length} ventas registradas hoy`} />
      <Metric label="Productos registrados" value={products.loading || products.error ? '—' : String(products.data.length)} note="Productos en el catálogo del negocio" />
      <Metric label="Ticket promedio de hoy" value={sales.loading || sales.error ? '—' : formatMoney(today.length ? today.reduce((sum, sale) => sum + saleTotal(sale), 0) / today.length : 0)} note="Monto promedio por venta" />
    </View>
    {products.error && <LoadNotice message={products.error} onRetry={() => void products.reload()} />}
    {sales.error && <LoadNotice message={sales.error} onRetry={() => void sales.reload()} />}
    <Pressable accessibilityRole="button" onPress={() => router.navigate('/alerts')} style={[s.card, s.row]}><Ionicons name="notifications-outline" size={28} color={t.primary} /><View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>Alertas de vencimiento</Text><Text style={s.muted}>Revisa los productos vencidos y próximos a vencer.</Text></View><Ionicons name="arrow-forward" color={t.primary} size={22} /></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.navigate('/reports')} style={[s.card, s.row]}><Ionicons name="bar-chart-outline" size={28} color={t.primary} /><View style={{ flex: 1, gap: 4 }}><Text style={s.heading}>Reportes del negocio</Text><Text style={s.muted}>Elige un período para consultar ingresos y descargar tus reportes.</Text></View><Ionicons name="arrow-forward" color={t.primary} size={22} /></Pressable>
  </ScrollView>;
}
