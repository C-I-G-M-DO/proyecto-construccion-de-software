import { Platform, Pressable, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useNotifications } from '@/context/notification-context';
import { remoteCapability, remoteNotificationsConfigured } from '@/services/notifications';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';

export default function NotificationSettings() {
  const s = useSurtioStyles(businessStyles), t = useSurtioTheme(), notifications = useNotifications();
  const mode = notifications.preferences.mode;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const capability = mounted ? remoteCapability() : { available: false, reason: 'Comprobando compatibilidad con avisos…' };
  const remote = remoteNotificationsConfigured() && capability.available;
  return <View style={s.card}>
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.heading}>Notificaciones</Text><Text style={s.label}>{notifications.message ? 'Revisar avisos' : mode === 'off' ? 'Desactivadas' : mode === 'push' ? 'Dispositivo registrado' : 'Avisos locales'}</Text></View>
    <Text style={s.muted}>{mode === 'push' ? 'El negocio puede enviarte avisos aunque Surtío esté cerrado.' : Platform.OS === 'web' ? 'Los avisos locales aparecen al abrir Surtío. Activa push para recibirlos con la página cerrada.' : 'Los avisos locales recuerdan los vencimientos alrededor de las 9:00. Las fechas se actualizan al abrir Surtío.'}</Text>
    {!remote && mode !== 'push' && <Text style={s.muted}>{!capability.available ? capability.reason : 'Las push estarán disponibles cuando el negocio conecte el envío de avisos.'}</Text>}
    <View style={s.row}>
      {mode !== 'local' && <Pressable accessibilityRole="button" disabled={notifications.busy} onPress={() => void notifications.enableLocal()} style={[s.button, { opacity: notifications.busy ? 0.5 : 1 }]}><Text style={s.buttonText}>Activar avisos locales</Text></Pressable>}
      {remote && mode !== 'push' && <Pressable accessibilityRole="button" disabled={notifications.busy} onPress={() => void notifications.enablePush()} style={[s.button, { opacity: notifications.busy ? 0.5 : 1 }]}><Text style={s.buttonText}>Activar push</Text></Pressable>}
      {mode !== 'off' && <><Pressable accessibilityRole="button" disabled={notifications.busy} onPress={() => void notifications.test()} style={[s.button, { backgroundColor: t.muted }]}><Text style={s.text}>Probar aviso</Text></Pressable><Pressable accessibilityRole="button" disabled={notifications.busy} onPress={() => void notifications.disable()} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}><Text style={s.link}>Desactivar</Text></Pressable></>}
    </View>
    {notifications.busy && <Text accessibilityLiveRegion="polite" style={s.muted}>Actualizando permisos y avisos…</Text>}
    {notifications.message && <Text accessibilityRole="alert" style={s.link}>{notifications.message}</Text>}
  </View>;
}
