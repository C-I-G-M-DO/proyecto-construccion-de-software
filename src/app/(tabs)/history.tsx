import { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusinessDate, LoadNotice, Metric } from '@/components/business-ui';
import SaleCard from '@/components/sale-card';
import { useFocusedList } from '@/hooks/use-focused-list';
import { useCurrentDay } from '@/hooks/use-current-day';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { HistoryFilters, Venta } from '@/types/sales';
import { amountError, filterSales, INITIAL_FILTERS, newestSales, saleTotal } from '@/utils/history';
import { formatMoney } from '@/utils/currency';

export default function HistoryScreen() {
  const t = useSurtioTheme(), s = useSurtioStyles(businessStyles), insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useFocusedList<Venta>('sales');
  const [filters, setFilters] = useState<HistoryFilters>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(Platform.OS === 'web');
  const today = useCurrentDay();
  const invalid = amountError(filters);
  const filtered = useMemo(() => invalid || !today ? [] : filterSales(data, filters, today), [data, filters, today, invalid]);
  const latestId = newestSales(data)[0]?._id;
  const update = (key: keyof HistoryFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  return <FlatList
    style={{ flex: 1, backgroundColor: t.background }}
    contentInsetAdjustmentBehavior="automatic"
    contentContainerStyle={[s.page, { paddingTop: Platform.OS === 'android' ? insets.top + 20 : 24, flexGrow: 1 }]}
    keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
    refreshing={loading} onRefresh={() => void reload()}
    data={error ? [] : filtered} keyExtractor={sale => sale._id}
    ListHeaderComponent={<View style={{ gap: 20, marginBottom: 20 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}><View style={{ gap: 6 }}><Text style={s.title}>Historial de órdenes</Text><Text style={s.muted}>Consulta las ventas y sus productos.</Text></View><BusinessDate /></View>
      <View style={s.card}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          {Platform.OS === 'web' ? <Text style={s.heading}>Filtrar órdenes</Text> : <Pressable accessibilityRole="button" accessibilityState={{ expanded: filtersOpen }} onPress={() => setFiltersOpen(value => !value)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={s.link}>{filtersOpen ? 'Ocultar filtros' : 'Más filtros'}</Text></Pressable>}
          <Pressable accessibilityRole="button" onPress={() => setFilters(INITIAL_FILTERS)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={s.link}>Restablecer</Text></Pressable>
        </View>
        {filtersOpen && <View style={s.row}>{([
          ['todos', 'Todo el historial'], ['dia', 'Hoy'], ['semana', 'Esta semana'], ['mes', 'Este mes'],
        ] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filters.periodo === value }} onPress={() => update('periodo', value)} style={[s.chip, filters.periodo === value && { backgroundColor: t.button }]}><Text style={{ color: filters.periodo === value ? '#FFFFFF' : t.secondary, fontWeight: '600' }}>{label}</Text></Pressable>)}</View>}
        <View style={[s.row, { alignItems: 'flex-start' }]}>
          {([['orden', 'Número de orden', 'Ej. 1024'], ['producto', 'Producto', 'Buscar por nombre']] as const).filter(([key]) => key === 'orden' || filtersOpen).map(([key, label, placeholder]) => <View key={key} style={{ flexGrow: 1, flexBasis: 220, gap: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={s.input} placeholderTextColor={t.secondary} placeholder={placeholder} value={filters[key]} onChangeText={value => update(key, value)} /></View>)}
          {filtersOpen && ([['montoMin', 'Monto mínimo (RD$)'], ['montoMax', 'Monto máximo (RD$)']] as const).map(([key, label]) => <View key={key} style={{ flexGrow: 1, flexBasis: 160, gap: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={s.input} placeholderTextColor={t.secondary} placeholder="Sin límite" keyboardType="decimal-pad" value={filters[key]} onChangeText={value => update(key, value)} /></View>)}
        </View>
        {invalid && <Text accessibilityRole="alert" style={s.link}>{invalid}</Text>}
      </View>
      {error ? <LoadNotice message={error} onRetry={() => void reload()} /> : !loading && !invalid && <View style={s.row}><Metric style={{ flexBasis: 160 }} label="Órdenes encontradas" value={String(filtered.length)} /><Metric style={{ flexBasis: 160 }} label="Total del período filtrado" value={formatMoney(filtered.reduce((sum, sale) => sum + saleTotal(sale), 0))} /></View>}
      <Text style={s.heading}>Órdenes · más recientes primero</Text>
    </View>}
    ListEmptyComponent={!error && !invalid ? <LoadNotice message={loading ? 'Cargando órdenes…' : data.length ? 'No hay órdenes con estos filtros. Prueba otro período o restablece la búsqueda.' : 'Todavía no hay ventas registradas.'} /> : null}
    renderItem={({ item }) => <SaleCard sale={item} latest={item._id === latestId} />}
  />;
}
