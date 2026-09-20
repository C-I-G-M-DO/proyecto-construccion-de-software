import { readSessionProfile } from '@/hooks/session-profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSurtioTheme } from '@/hooks/use-surtio-theme';

type Sale = { _id: string; subtotal: number; numeroOrden: number; createdAt: string };
const money = (n: number) => `RD$ ${n.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function MobileDashboard() {
  const t = useSurtioTheme();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.3;
  const [sales, setSales] = useState<Sale[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [business, setBusiness] = useState('Mi negocio');
  const [name, setName] = useState('José');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setLoading(true); setError(null); setCount(null); setSales([]);
    async function load() {
      try {
        const token = await AsyncStorage.getItem('token');
        const profile = await readSessionProfile();
        if (controller.signal.aborted) return;
        setBusiness(profile.businessName || 'Mi negocio');
        setName(profile.name?.trim().split(/\s+/)[0] || 'José');
        const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
        if (!token) throw new Error('Inicia sesión para consultar el resumen.');
        if (!base) throw new Error('Falta configurar la dirección del backend.');
        const read = async (route: string) => {
          const res = await fetch(`${base}/api/${route}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
          const data = await res.json().catch(() => null);
          if (!res.ok) throw new Error(data?.message || `Error al consultar ${route}.`);
          if (!Array.isArray(data)) throw new Error('El servidor devolvió un formato inesperado.');
          return data;
        };
        const [newSales, products] = await Promise.all([read('sales'), read('products')]);
        if (!controller.signal.aborted) { setSales(newSales); setCount(products.length); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el resumen.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [revision]));
  const today = sales.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString());
  const section = { color: t.text, fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.5 };
  const card = { backgroundColor: t.card, borderRadius: 18, padding: 18, gap: 12, borderWidth: 1, borderColor: t.border };
  const metrics = [
    { title: 'VENTAS DE HOY', value: count === null ? '—' : money(today.reduce((sum,s) => sum+s.subtotal,0)), note: count === null ? 'Sin datos disponibles' : `${today.length} cobros registrados`, icon: '$' },
    { title: 'FIAO POR COBRAR', value: 'Próximamente', note: 'Cuentas por cobrar', icon: '▤' },
    { title: 'PRODUCTOS', value: count === null ? '—' : String(count), note: 'Productos registrados', icon: '□' },
    { title: 'STOCK BAJO', value: 'Próximamente', note: 'Alertas de inventario', icon: '△' },
  ];
  return <FlatList
    style={{ flex: 1, backgroundColor: t.background }} contentInsetAdjustmentBehavior="automatic"
    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 16, paddingBottom: 32, width: '100%', maxWidth: 1000, alignSelf: 'center', flexGrow: 1 }}
    refreshing={loading} onRefresh={() => setRevision(n => n+1)} data={sales.slice(0,5)} keyExtractor={s => s._id}
    ListHeaderComponent={<View style={{ gap: 24, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.button, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 30 }}>S</Text></View>
        <View style={{ flex: 1, gap: 4 }}><Text style={{ color: t.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.7 }}>{business.toUpperCase()}</Text><Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>Inicio</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={() => router.push('../profile')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.button, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{name.charAt(0).toUpperCase()}</Text></Pressable>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '700' }}>¡Dímelo, {name}! 👋</Text>
        <Text style={{ color: t.secondary }}>{business}</Text>
        <View style={{ backgroundColor: t.muted, borderRadius: 12, padding: 12, marginTop: 4 }}>
          <Text style={{ color: t.secondary, fontWeight: '600', fontSize: 13 }}>{new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
        </View>
      </View>
      {error && <View style={card}><Text style={{ color: t.text }}>{error}</Text><Pressable onPress={() => setRevision(n => n+1)} style={{ paddingVertical: 12 }}><Text style={{ color: t.primary }}>Reintentar</Text></Pressable></View>}
      <Text style={section}>RESUMEN DE OPERACIÓN</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {metrics.map(metric => <View key={metric.title} style={[card, { width: compact ? '100%' : '48%', flexGrow: 1 }]}>
          <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'space-between' }}><Text style={{ color: t.secondary, fontSize: 11, flex: 1 }}>{metric.title}</Text><Text style={{ color: t.primary }}>{metric.icon}</Text></View>
          <Text selectable style={{ color: t.text, fontSize: metric.value === 'Próximamente' ? 17 : 24, fontWeight: '700' }}>{metric.value}</Text>
          <Text style={{ color: t.secondary, fontSize: 12 }}>{metric.note}</Text>
        </View>)}
      </View>
      <Text style={section}>ACCIONES DE MOSTRADOR</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[
          { title: 'Registrar venta', subtitle: 'Seleccionar productos', icon: '▥', route: '../products' as const },
          { title: 'Anotar a cuenta', subtitle: 'Libreta de fiao', icon: '▤', route: null },
          { title: 'Nuevo producto', subtitle: 'Entrada de stock', icon: '＋', route: '/add_product' as const },
          { title: 'Hacer pedido', subtitle: 'Conectarse a Surtío', icon: '▱', route: null },
        ].map(action => <Pressable key={action.title} disabled={!action.route} accessibilityRole="button" accessibilityState={{ disabled: !action.route }} onPress={() => action.route && router.push(action.route)} style={[card, { width: compact ? '100%' : '48%', flexGrow: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}><Text style={{ fontSize: 26, color: t.primary }}>{action.icon}</Text>{!action.route && <Text style={{ color: t.secondary, backgroundColor: t.muted, padding: 5, borderRadius: 10, fontSize: 12 }}>Pronto</Text>}</View>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{action.title}</Text><Text style={{ color: t.secondary, fontSize: 13 }}>{action.subtitle}</Text>
        </Pressable>)}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}><Text style={section}>ACTIVIDAD RECIENTE</Text><Pressable onPress={() => router.push('/history')} style={{ paddingVertical: 12 }}><Text style={{ color: t.primary }}>Ver historial →</Text></Pressable></View>
    </View>}
    ListEmptyComponent={<View style={card}><Text style={{ color: t.secondary }}>{loading ? 'Cargando ventas…' : error ? 'No se pudo consultar la actividad.' : 'Todavía no hay ventas registradas.'}</Text></View>}
    renderItem={({item}) => <Pressable onPress={() => router.push('/history')} style={[card, { marginBottom: 12 }]}><Text style={{ color: t.text, fontWeight: '700' }}>Orden #{item.numeroOrden}</Text><Text style={{ color: t.secondary }}>{new Date(item.createdAt).toLocaleString('es-DO')}</Text><Text style={{ color: t.primary, fontWeight: '700' }}>{money(item.subtotal)}</Text></Pressable>}
  />;
}
