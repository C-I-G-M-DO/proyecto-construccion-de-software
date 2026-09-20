import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { styles } from '@/styles/dashboard-home.styles.web';

type Sale = { _id: string; numeroOrden: number; subtotal: number; createdAt: string };
type Product = { _id: string; stock: number };
const currency = (value: number) => `RD$ ${value.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DashboardHome() {
  const { width } = useWindowDimensions();
  const narrow = width < 950;
  const [data, setData] = useState<{ sales: Sale[]; products: Product[]; updated: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    async function load() {
      try {
        const token = await AsyncStorage.getItem('token');
        const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
        if (!token) throw new Error('Inicia sesión para consultar los datos de tu negocio.');
        if (!base) throw new Error('Falta configurar la dirección del backend.');
        const fetchList = async (route: string) => {
          const response = await fetch(`${base}/api/${route}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
          const result = await response.json().catch(() => null);
          if (!response.ok) throw new Error(result?.message || `No se pudo consultar ${route} (HTTP ${response.status}).`);
          if (!Array.isArray(result)) throw new Error(`Respuesta inesperada al consultar ${route}.`);
          return result;
        };
        const [sales, products] = await Promise.all([fetchList('sales'), fetchList('products')]);
        if (!controller.signal.aborted) setData({ sales, products, updated: new Date() });
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el resumen.');
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]));

  const today = new Date().toDateString();
  const todaySales = data?.sales.filter(sale => new Date(sale.createdAt).toDateString() === today) ?? [];
  const metrics = [
    { title: 'Ventas de hoy', value: data ? currency(todaySales.reduce((sum, sale) => sum + sale.subtotal, 0)) : '—', note: data ? `${todaySales.length} ventas registradas hoy` : 'Esperando datos', icon: '$' },
    { title: 'Productos registrados', value: data ? String(data.products.length) : '—', note: 'Productos de tu catálogo', icon: '□' },
    { title: 'Productos agotados', value: data ? String(data.products.filter(product => product.stock <= 0).length) : '—', note: 'Existencias iguales o menores a cero', icon: '△' },
    { title: 'Fiao pendiente', value: 'Próximamente', note: 'Cuentas de fiao aún no disponibles', icon: '▤' },
  ];

  return <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, narrow && styles.contentNarrow]}>
    <View style={[styles.pageHeader, narrow && styles.pageHeaderNarrow]}>
      <View style={styles.titleArea}>
        <Text style={styles.pageTitle}>Tu negocio siempre listo</Text>
        <Text style={styles.pageSubtitle}>Aquí tienes un resumen de tu negocio</Text>
      </View>
      <View style={styles.dateCard}><Text style={styles.dateText}>{new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}</Text></View>
    </View>
    <View style={styles.headerDivider} />
    <View style={styles.phaseBanner}>
      <View style={styles.phaseInformation}>
        <Text style={styles.phaseTitle}>{error ? 'No pudimos actualizar el resumen' : data ? 'Tu información, en un solo lugar' : 'Cargando tu negocio…'}</Text>
        <Text selectable style={styles.phaseDescription}>{error ?? 'Consulta tus ventas y productos. Las nuevas herramientas aparecerán aquí cuando estén disponibles.'}</Text>
      </View>
      <Pressable onPress={() => setAttempt(value => value + 1)} accessibilityRole="button" style={{ padding: 12 }}><Text style={{ color: '#C00000', fontWeight: '700' }}>{error ? 'Reintentar' : 'Actualizar'}</Text></Pressable>
    </View>
    <View style={styles.metricsGrid}>
      {metrics.map(metric => <View key={metric.title} style={[styles.metricCard, { width: narrow ? '100%' : width < 1400 ? '48%' : '23.5%' }]}>
        <View style={styles.metricHeader}><Text style={styles.metricTitle}>{metric.title}</Text><View style={styles.metricIconContainer}><Text style={styles.metricIcon}>{metric.icon}</Text></View></View>
        <Text selectable style={[styles.metricValue, metric.value === 'Próximamente' && { fontSize: 20 }]}>{metric.value}</Text>
        <Text style={styles.metricDescription}>{metric.note}</Text>
      </View>)}
    </View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Acciones rápidas</Text><Text style={styles.sectionSubtitle}>Accesos directos a operaciones frecuentes</Text></View>
    <View style={styles.quickActionsGrid}>
      {[
        { title: 'Ver historial', description: 'Consultar ventas', route: '/history' as const, icon: '◷' },
        { title: 'Agregar producto', description: 'Carga a inventario', route: '/add_product' as const, icon: '＋' },
        { title: 'Crear pedido', description: 'Orden de entrega', route: null, icon: '▱' },
        { title: 'Registrar fiao', description: 'Libreta de balance', route: null, icon: '▤' },
      ].map(action => <Pressable key={action.title} disabled={!action.route} accessibilityRole="button" accessibilityState={{ disabled: !action.route }} onPress={() => action.route && router.push(action.route)} style={[styles.quickActionCard, { width: narrow ? '100%' : '48%', flexWrap: 'wrap' }]}>
        <View style={styles.quickActionIconContainer}><Text style={styles.quickActionIcon}>{action.icon}</Text></View>
        <View style={styles.quickActionInformation}><Text style={styles.quickActionTitle}>{action.title}</Text><Text style={styles.quickActionDescription}>{action.description}</Text></View>
        {!action.route && <View style={styles.soonBadge}><Text style={styles.soonText}>Próximamente</Text></View>}
      </Pressable>)}
    </View>
    <View style={[styles.bottomGrid, narrow && styles.bottomGridNarrow]}>
      <View style={[styles.activityCard, narrow && styles.fullWidthCard]}>
        <View style={styles.cardHeading}><Text style={styles.cardTitle}>Actividad reciente</Text><Pressable onPress={() => router.push('/history')} style={{ padding: 10 }}><Text style={{ color: '#C00000' }}>Ver historial →</Text></Pressable></View>
        <View style={styles.cardDivider} />
        {data?.sales.slice(0, 5).map(sale => <View key={sale._id} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E2E1', gap: 6 }}>
          <Text style={styles.statusTitle}>Orden #{sale.numeroOrden}</Text><Text style={styles.statusDescription}>{new Date(sale.createdAt).toLocaleString('es-DO')}</Text><Text style={{ color: '#C00000', fontWeight: '700' }}>{currency(sale.subtotal)}</Text>
        </View>)}
        {(!data || !data.sales.length) && <View style={styles.emptyActivity}><Text style={styles.emptyTitle}>{error ? 'Datos no disponibles' : !data ? 'Cargando ventas…' : 'Todavía no hay ventas registradas'}</Text><Text style={styles.emptyDescription}>Las ventas de tu negocio aparecerán aquí.</Text></View>}
      </View>
      <View style={[styles.statusCard, narrow && styles.fullWidthCard]}>
        <Text style={styles.cardTitle}>Estado general</Text>
        <View style={styles.cardDivider} />
        <Text style={styles.statusTitle}>Consulta al backend</Text><Text style={styles.statusDescription}>{error ? 'No se pudo completar la consulta' : data ? 'Productos y ventas consultados correctamente' : 'Consultando…'}</Text>
        <View style={styles.statusDivider} />
        <Text style={styles.statusTitle}>Última actualización</Text><Text style={styles.statusDescription}>{data?.updated.toLocaleTimeString('es-DO') ?? '—'}</Text>
        <View style={styles.statusDivider} />
        <Text style={styles.statusTitle}>Próximamente</Text><Text style={styles.statusDescription}>Pedidos, cuentas de fiao, clientes y reportes.</Text>
      </View>
    </View>
  </ScrollView>;
}
