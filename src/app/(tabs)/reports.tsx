import { useSurtioTheme } from '@/hooks/use-surtio-theme';
import { fetchList } from '@/services/lists';
import { formatMoney as money } from '@/utils/currency';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Venta = { _id: string; createdAt: string; subtotal: number; items: { productoId?: string; nombre: string; cantidad: number; precio: number; total?: number }[] };
type Periodo = 'hoy' | '7' | '30';

export default function ReportsScreen() {
  const t = useSurtioTheme();
  const insets = useSafeAreaInsets();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>('hoy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  const cargar = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    try {
      const data = await fetchList<Venta>('sales', request.signal);
      if (!request.signal.aborted) { setVentas(data); setError(null); }
    } catch (cause) { if (!request.signal.aborted) { setVentas([]); setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los reportes.'); } }
    finally { if (!request.signal.aborted) setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void cargar(); return () => controller.current?.abort(); }, [cargar]));

  const resumen = useMemo(() => {
    const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
    if (periodo !== 'hoy') inicio.setDate(inicio.getDate() - (periodo === '7' ? 6 : 29));
    const filtradas = ventas.filter(v => { const d = new Date(v.createdAt); return !Number.isNaN(d.getTime()) && d >= inicio; });
    const ingreso = filtradas.reduce((sum, v) => sum + Number(v.subtotal || 0), 0);
    const productos = new Map<string, { nombre: string; cantidad: number; ingreso: number }>();
    filtradas.forEach(venta => (venta.items || []).forEach(item => {
      const key = item.productoId || item.nombre;
      const current = productos.get(key) || { nombre: item.nombre, cantidad: 0, ingreso: 0 };
      current.cantidad += Number(item.cantidad || 0);
      current.ingreso += Number(item.total ?? (item.cantidad || 0) * (item.precio || 0));
      productos.set(key, current);
    }));
      return { cantidad: filtradas.length, ingreso, promedio: filtradas.length ? ingreso / filtradas.length : 0, productos: [...productos.values()].sort((a,b) => b.ingreso - a.ingreso).slice(0, 5) };
  }, [ventas, periodo]);

  const card = { backgroundColor: t.card, borderWidth: 1, borderColor: t.border, borderRadius: 16, padding: 18, gap: 8 } as const;
  return <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['left','right']}><ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28, gap: 18, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
    <Text style={{ color: t.text, fontSize: 28, fontWeight: '800' }}>Reportes</Text><Text style={{ color: t.secondary, lineHeight: 21 }}>Resumen calculado a partir de las ventas registradas. Las fechas siguen la hora de este dispositivo.</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}>{([['hoy','Hoy'],['7','7 días'],['30','30 días']] as const).map(([key,label]) => <Pressable key={key} onPress={() => setPeriodo(key)} accessibilityRole="button" accessibilityState={{ selected: periodo === key }} style={{ flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: periodo === key ? t.button : t.card, borderWidth: 1, borderColor: periodo === key ? t.button : t.border }}><Text style={{ color: periodo === key ? '#FFFFFF' : t.text, fontWeight: '700' }}>{label}</Text></Pressable>)}</View>
    {error && <View style={card}><Text style={{ color: t.text }}>{error}</Text><Pressable onPress={() => { void cargar(); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: t.primary }}>Reintentar</Text></Pressable></View>}
    {loading ? <ActivityIndicator color={t.primary} /> : <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {[['Ventas',String(resumen.cantidad)],['Ingresos',money(resumen.ingreso)],['Ticket promedio',money(resumen.promedio)]].map(([label,value]) => <View key={label} style={[card, { minWidth: 145, flexGrow: 1 }]}><Text style={{ color: t.secondary }}>{label}</Text><Text selectable style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>{value}</Text></View>)}
    </View><View style={card}><Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>Productos con más ingresos</Text>{resumen.productos.length ? resumen.productos.map((p,index) => <View key={`${p.nombre}-${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderBottomColor: t.border, borderBottomWidth: 1 }}><View style={{ flex: 1 }}><Text style={{ color: t.text, fontWeight: '600' }}>{index + 1}. {p.nombre}</Text><Text style={{ color: t.secondary }}>{p.cantidad} presentaciones vendidas</Text></View><Text style={{ color: t.text, fontWeight: '700' }}>{money(p.ingreso)}</Text></View>) : <Text style={{ color: t.secondary }}>No hay ventas en este período.</Text>}</View></>}
  </ScrollView></SafeAreaView>;
}
