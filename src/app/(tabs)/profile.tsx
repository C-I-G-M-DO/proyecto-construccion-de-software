import { readSessionProfile } from '@/hooks/session-profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSurtioTheme } from '@/hooks/use-surtio-theme';
import { useCart } from '@/context/cart_context';
import { useProducts } from '@/context/product_context';

type User = { name?: string; phone?: string; businessName?: string };
export default function ProfileScreen() {
  const t = useSurtioTheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { vaciarCarrito } = useCart();
  const { setProductos } = useProducts();
  useFocusEffect(useCallback(() => {
    let active = true;
    setError(false);
    readSessionProfile().then(profile => {
      if (active) setUser(profile);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []));
  async function logout() {
    if (leaving) return;
    setLeaving(true);
    try {
      await AsyncStorage.multiRemove(['token', 'surtio.user', 'nombreColmado']);
      vaciarCarrito(); setProductos([]);
      router.replace('/login');
    } catch { Alert.alert('No se pudo cerrar sesión', 'Inténtalo de nuevo.'); }
    finally { setLeaving(false); }
  }
  const card = { backgroundColor: t.card, borderRadius: 20, borderWidth: 1, borderColor: t.border, padding: 20, gap: 18 };
  const row = { backgroundColor: t.muted, borderRadius: 14, padding: 16, gap: 6 };
  const title = { color: t.text, fontSize: 20, fontWeight: '700' as const };
  return <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === 'ios' ? 16 : insets.top+16, paddingBottom: 32, gap: 24, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
    <Text style={{ color: t.text, fontSize: 26, fontWeight: '700' }}>Surtío · Perfil</Text>
    <View style={card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: t.button, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 25, fontWeight: '700' }}>{user?.name?.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('') || 'S'}</Text></View>
        <View style={{ flex: 1, gap: 6 }}><Text style={title}>{user?.name || 'Mi cuenta'}</Text><Text style={{ color: t.secondary }}>{user?.businessName || 'Mi negocio'}</Text></View>
      </View>
      {(!user?.name || error) && <Text style={{ color: t.secondary, lineHeight: 21 }}>{error ? 'No se pudieron leer los datos guardados.' : 'Esta sesión se inició sin guardar el perfil completo. Vuelve a iniciar sesión para recuperar tu nombre y negocio del servidor.'}</Text>}
    </View>
    {!user?.name && <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={{ padding: 16, backgroundColor: t.muted, borderRadius: 12 }}><Text style={{ color: t.primary, fontWeight: '700' }}>Iniciar sesión para completar mi perfil</Text></Pressable>}
    <View style={card}>
      <Text style={title}>Detalles de la cuenta</Text>
      {[['Nombre',user?.name],['Negocio',user?.businessName],['Teléfono móvil',user?.phone]].map(([label,value]) => <View key={label} style={row}><Text style={{ color: t.secondary, fontSize: 13 }}>{label}</Text><Text selectable style={{ color: t.text, fontSize: 17 }}>{value || 'Pendiente de recuperar'}</Text></View>)}
    </View>
    <View style={card}>
      <Text style={title}>Seguridad y credenciales</Text>
      <View style={row}><Text style={{ color: t.secondary }}>Contraseña</Text><Text accessibilityLabel="Contraseña oculta" style={{ color: t.text, fontSize: 24, letterSpacing: 3 }}>••••••••</Text><Text style={{ color: t.secondary, fontSize: 12 }}>Oculta. No se guarda en este dispositivo.</Text></View>
      {['Cambiar contraseña','Dispositivos vinculados'].map(label => <View key={label} style={row}><Text style={{ color: t.text }}>{label}</Text><Text style={{ color: t.secondary, fontSize: 12 }}>Próximamente</Text></View>)}
    </View>
    <View style={card}><Text style={title}>Apariencia</Text><Text style={{ color: t.secondary }}>Automática · {t.dark ? 'Modo oscuro' : 'Modo claro'} del dispositivo</Text></View>
    <Pressable accessibilityRole="button" disabled={leaving} onPress={logout} style={{ padding: 18, minHeight: 54, alignItems: 'center', borderRadius: 14, backgroundColor: t.button }}><Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>{leaving ? 'Cerrando sesión…' : 'Cerrar sesión'}</Text></Pressable>
  </ScrollView>;
}
