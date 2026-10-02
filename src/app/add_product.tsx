import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSurtioTheme } from '@/hooks/use-surtio-theme';
import { Precio } from '@/types/products';
import { MEDIDAS, nombreMedida, UnidadStock } from '@/constants/measures';

type ProductImage = { public_id: string; url: string };
const number = (value: string) => Number(value.replace(',', '.'));
export default function AddProductScreen() {
  const t = useSurtioTheme();
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<Precio['tipo']>('unidad');
  const [unidadStock, setUnidadStock] = useState<UnidadStock>('unidad');
  const [showMedidas, setShowMedidas] = useState(false);
  const [equivalencia, setEquivalencia] = useState('');
  const [stock, setStock] = useState('');
  const [imagen, setImagen] = useState('');
  const [imagenes, setImagenes] = useState<ProductImage[]>([]);
  const [showImages, setShowImages] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const api = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  const back = () => router.canGoBack() ? router.back() : router.replace('/home');

  function cambiarUnidadStock(value: UnidadStock) {
    if (value === unidadStock) return;
    const aplicar = () => { setUnidadStock(value); setTipo(value); setPrecios([]); setValor(''); setEquivalencia(''); };
    if (precios.length) {
      Alert.alert('Cambiar unidad de stock', 'Al cambiarla se quitarán los precios agregados para la unidad anterior.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cambiar', onPress: aplicar },
      ]);
    } else aplicar();
  }

  function agregarPrecio() {
    if (!valor.trim() || !Number.isFinite(number(valor)) || number(valor) < 0) {
      Alert.alert('Precio inválido', 'Escribe un precio igual o mayor que cero.'); return;
    }
    if (tipo === 'paquete' && (!equivalencia.trim() || !Number.isInteger(number(equivalencia)) || number(equivalencia) <= 0)) {
      Alert.alert('Equivalencia inválida', 'Indica un número entero de unidades por paquete.'); return;
    }
    const price: Precio = { tipo, valor: number(valor), ...(tipo === 'paquete' ? { equivalencia: number(equivalencia) } : {}) };
    setPrecios(current => [...current.filter(p => p.tipo !== tipo), price]);
    setValor(''); setEquivalencia('');
  }
  async function cargarImagenes() {
    setShowImages(true); setImageLoading(true); setImageError(null);
    try {
      if (!api) throw new Error('Falta configurar la dirección del backend.');
      const res = await fetch(`${api}/api/imagenes`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data)) throw new Error('No se pudo cargar el catálogo de imágenes.');
      setImagenes(data.filter(item => typeof item?.url === 'string' && typeof item?.public_id === 'string'));
    } catch (error) { setImageError(error instanceof Error ? error.message : 'Error al cargar imágenes.'); }
    finally { setImageLoading(false); }
  }
  async function guardar() {
    if (savingRef.current) return;
    if (!nombre.trim() || !precios.length || !stock.trim() || !Number.isFinite(number(stock)) || number(stock) < 0) {
      Alert.alert('Revisa el formulario', 'Completa el nombre, agrega al menos un precio e indica existencias iguales o mayores que cero.'); return;
    }
    if (unidadStock === 'unidad' && !Number.isInteger(number(stock))) {
      Alert.alert('Existencias inválidas', 'Para productos por unidad, escribe una cantidad entera.'); return;
    }
    if (valor.trim()) { Alert.alert('Precio sin agregar', 'Pulsa Agregar precio o borra el precio pendiente antes de guardar.'); return; }
    savingRef.current = true; setSaving(true);
    try {
      if (!api) throw new Error('Falta configurar la dirección del backend.');
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Inicia sesión para guardar el producto.');
      const res = await fetch(`${api}/api/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim(), precios, stock: number(stock), unidadStock, imagen }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || 'No se pudo guardar el producto.');
      Alert.alert('Producto guardado', 'El producto ya forma parte de tu catálogo.'); back();
    } catch (error) { Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Revisa la conexión e inténtalo de nuevo.'); }
    finally { setSaving(false); savingRef.current = false; }
  }

  const card = { padding: 20, borderRadius: 18, borderWidth: 1, borderColor: t.border, backgroundColor: t.card, gap: 14 };
  const input = { minHeight: 52, borderWidth: 1, borderColor: t.border, backgroundColor: t.background, color: t.text, borderRadius: 12, padding: 14, fontSize: 16 };
  const label = { color: t.text, fontSize: 17, fontWeight: '600' as const };
  const muted = { color: t.secondary, fontSize: 13, lineHeight: 20 };
  return <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="never" contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 20, flexGrow: 1, width: '100%', maxWidth: 660, alignSelf: 'center' }}>
        <Pressable onPress={back} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}><Text style={{ color: t.primary, fontWeight: '600' }}>← Volver</Text></Pressable>
        <View style={{ gap: 8 }}><Text style={{ color: t.text, fontSize: 28, fontWeight: '700' }}>Nuevo producto</Text><Text style={muted}>Agrega un producto al inventario de tu negocio.</Text></View>
        <View style={card}>
          <Text style={label}>Información del producto</Text>
          <TextInput accessibilityLabel="Nombre del producto" value={nombre} onChangeText={setNombre} placeholder="Nombre del producto" placeholderTextColor={t.secondary} style={input} />
          <Pressable onPress={cargarImagenes} accessibilityRole="button" style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: t.border, borderRadius: 14, padding: 20, alignItems: 'center', gap: 10 }}>
            {imagen ? <Image source={{ uri: imagen }} resizeMode="contain" style={{ width: '100%', height: 120 }} /> : <Text style={{ color: t.primary, fontSize: 32 }}>＋</Text>}
            <Text style={{ color: t.primary, fontWeight: '600' }}>{imagen ? 'Cambiar imagen' : 'Seleccionar imagen'}</Text><Text style={muted}>Imagen del catálogo · Opcional</Text>
          </Pressable>
        </View>
        <View style={card}>
          <Text style={label}>Precios de venta</Text><Text style={muted}>Primero indica cómo cuentas el inventario. Cada presentación tendrá su propio precio en RD$.</Text>
          <Text style={{ color: t.text, fontWeight: '600' }}>Stock contado en</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>{(['unidad', 'libra'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: unidadStock === value }} onPress={() => cambiarUnidadStock(value)} style={{ flex: 1, padding: 12, minHeight: 48, borderRadius: 10, alignItems: 'center', backgroundColor: unidadStock === value ? t.tint : t.muted, borderWidth: 1, borderColor: unidadStock === value ? t.primary : t.border }}><Text style={{ color: unidadStock === value ? t.primary : t.text, fontWeight: '600' }}>{value === 'unidad' ? 'Unidades' : 'Libras'}</Text></Pressable>)}</View>
          <Text style={{ color: t.text, fontWeight: '600' }}>Presentación de venta</Text>
          <Pressable onPress={() => setShowMedidas(true)} accessibilityRole="button" accessibilityLabel="Seleccionar medida" style={[input, { justifyContent: 'center' }]}><Text style={{ color: t.text }}>{nombreMedida(tipo)}  ▾</Text></Pressable>
          <TextInput accessibilityLabel="Precio en pesos" value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="RD$ 0.00" placeholderTextColor={t.secondary} style={input} />
          {tipo === 'paquete' && <TextInput accessibilityLabel="Unidades por paquete" value={equivalencia} onChangeText={setEquivalencia} keyboardType="decimal-pad" placeholder="Unidades por paquete" placeholderTextColor={t.secondary} style={input} />}
          <Pressable onPress={agregarPrecio} accessibilityRole="button" style={{ padding: 16, minHeight: 50, backgroundColor: t.tint, borderRadius: 12, alignItems: 'center' }}><Text style={{ color: t.primary, fontWeight: '700' }}>＋ Agregar precio</Text></Pressable>
          {precios.map(p => <View key={p.tipo} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: t.border, paddingTop: 10 }}><View style={{ flex: 1 }}><Text style={{ color: t.text }}>{nombreMedida(p.tipo)} · RD$ {p.valor.toFixed(2)}</Text>{p.tipo === 'paquete' && <Text style={muted}>{p.equivalencia} unidades por paquete</Text>}</View><Pressable accessibilityLabel={`Quitar precio por ${p.tipo}`} onPress={() => setPrecios(current => current.filter(price => price.tipo !== p.tipo))} style={{ padding: 12 }}><Text style={{ color: t.primary }}>Quitar</Text></Pressable></View>)}
        </View>
        <View style={card}><Text style={label}>Existencias iniciales</Text><Text style={muted}>Cantidad disponible en {unidadStock === 'libra' ? 'libras' : 'unidades'}.</Text><TextInput accessibilityLabel="Existencias iniciales" value={stock} onChangeText={setStock} keyboardType="decimal-pad" placeholder="Ej. 20" placeholderTextColor={t.secondary} style={input} /></View>
        <Pressable onPress={guardar} disabled={saving} accessibilityRole="button" accessibilityState={{ disabled: saving }} style={{ backgroundColor: t.button, opacity: saving ? 0.6 : 1, padding: 18, minHeight: 54, borderRadius: 14, alignItems: 'center' }}><Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>{saving ? 'Guardando…' : 'Guardar producto'}</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
    <Modal visible={showMedidas} transparent animationType="fade" onRequestClose={() => setShowMedidas(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20, justifyContent: 'center' }}>
        <View style={[card, { width: '100%', maxWidth: 500, alignSelf: 'center', maxHeight: '85%' }]}>
          <Text style={label}>Seleccionar presentación</Text>
          <ScrollView contentContainerStyle={{ gap: 8 }}>{MEDIDAS.filter(m => m.unidadStock === unidadStock).map(m => <Pressable key={m.tipo} accessibilityRole="button" accessibilityState={{ selected: tipo === m.tipo }} onPress={() => { setTipo(m.tipo); setEquivalencia(''); setShowMedidas(false); }} style={{ minHeight: 48, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: tipo === m.tipo ? t.primary : t.border, backgroundColor: tipo === m.tipo ? t.tint : t.card, justifyContent: 'center' }}><Text style={{ color: t.text }}>{m.nombre}</Text></Pressable>)}</ScrollView>
          <Pressable onPress={() => setShowMedidas(false)} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: t.primary }}>Cancelar</Text></Pressable>
        </View>
      </SafeAreaView>
    </Modal>
    <Modal visible={showImages} transparent animationType="fade" onRequestClose={() => setShowImages(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20, justifyContent: 'center' }}>
        <View style={[card, { width: '100%', maxWidth: 560, alignSelf: 'center', maxHeight: '90%' }]}>
          <Text style={label}>Seleccionar imagen</Text>
          {imageLoading && <ActivityIndicator color={t.primary} />}
          {imageError ? <><Text style={muted}>{imageError}</Text><Pressable onPress={cargarImagenes} style={{ padding: 12 }}><Text style={{ color: t.primary }}>Reintentar</Text></Pressable></> : <FlatList data={imagenes} numColumns={3} keyExtractor={item => item.public_id} style={{ flexGrow: 0 }} ListEmptyComponent={!imageLoading ? <Text style={muted}>No hay imágenes disponibles.</Text> : null} renderItem={({item}) => <Pressable accessibilityLabel="Seleccionar imagen del producto" onPress={() => { setImagen(item.url); setShowImages(false); }} style={{ width: '33.33%', padding: 4 }}><Image source={{ uri: item.url }} resizeMode="contain" style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }} /></Pressable>} />}
          <Pressable onPress={() => setShowImages(false)} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: t.primary }}>Cancelar</Text></Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}
