import { useEffect, useMemo, useState } from 'react';
import NotificationSettings from '@/components/notification-settings';
import { useNotifications } from '@/context/notification-context';
import { FlatList, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusinessDate, LoadNotice } from '@/components/business-ui';
import ExpiryCard from '@/components/expiry-card';
import { useCurrentDay } from '@/hooks/use-current-day';
import { useFocusedList } from '@/hooks/use-focused-list';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { Producto } from '@/types/products';
import type { ExpiryState } from '@/types/expiry';
import { expiryAlerts, EXPIRY_WARNING_DAYS } from '@/utils/expiry';

export default function AlertsScreen() {
  const t = useSurtioTheme(), s = useSurtioStyles(businessStyles), insets = useSafeAreaInsets(), now = useCurrentDay();
  const { data: products, loading, error, reload } = useFocusedList<Producto>('products');
  const { synchronize } = useNotifications();
  useEffect(() => { if (!loading && !error) synchronize(products); }, [products, loading, error, synchronize]);
  const [filter, setFilter] = useState<ExpiryState | 'alertas'>('alertas');
  const lots = useMemo(() => now ? expiryAlerts(products, now) : [], [products, now]);
  const availableProducts = products.filter(product => product.stock > 0);
  const datedProducts = new Set(lots.map(lot => lot.productoId));
  const withoutDates = availableProducts.filter(product => !datedProducts.has(product._id)).length;
  const visible = lots.filter(lot => filter === 'alertas' ? lot.estado !== 'vigente' : lot.estado === filter);
  const choices = [
    { value: 'alertas', label: 'Todas las alertas', count: lots.filter(lot => lot.estado !== 'vigente').length },
    { value: 'vencido', label: 'Vencidos', count: lots.filter(lot => lot.estado === 'vencido').length },
    { value: 'pronto', label: 'Por vencer', count: lots.filter(lot => lot.estado === 'pronto').length },
    { value: 'vigente', label: 'Sin alertas', count: lots.filter(lot => lot.estado === 'vigente').length },
  ] as const;
  return <FlatList style={{ flex: 1, backgroundColor: t.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[s.page, { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? insets.top + 20 : 20, flexGrow: 1 }]} refreshing={loading} onRefresh={() => void reload()} data={error ? [] : visible} keyExtractor={lot => lot.id}
    ListHeaderComponent={<View style={{ gap: 20, marginBottom: 20 }}>
      <Text style={s.title}>Alertas de vencimiento</Text><Text style={s.muted}>Revisa los lotes que vencen hoy o durante los próximos {EXPIRY_WARNING_DAYS} días.</Text><BusinessDate />
      <NotificationSettings />
      <View style={s.row}>{choices.map(choice => <Pressable key={choice.value} accessibilityRole="button" accessibilityState={{ selected: filter === choice.value }} onPress={() => setFilter(choice.value)} style={[s.chip, filter === choice.value && { backgroundColor: t.button }]}><Text style={{ color: filter === choice.value ? '#FFFFFF' : t.secondary, fontWeight: '600' }}>{choice.label} · {choice.count}</Text></Pressable>)}</View>
      {error && <LoadNotice message={error} onRetry={() => void reload()} />}
      {!loading && !error && withoutDates > 0 && <LoadNotice message={`${withoutDates} producto${withoutDates === 1 ? '' : 's'} con existencias no ${withoutDates === 1 ? 'tiene' : 'tienen'} vencimientos registrados. No se puede comprobar su fecha.`} />}
    </View>}
    ListEmptyComponent={!error ? <LoadNotice message={loading ? 'Consultando vencimientos…' : !lots.length ? 'No hay lotes con fecha de vencimiento disponibles.' : filter === 'vigente' ? 'No hay lotes fuera del período de alerta.' : filter === 'vencido' ? 'No hay lotes vencidos con existencias.' : filter === 'pronto' ? 'No hay lotes por vencer en los próximos 7 días.' : 'Los lotes con fecha registrada no tienen alertas de vencimiento.'} /> : null}
    renderItem={({ item }) => <ExpiryCard alert={item} />}
  />;
}
