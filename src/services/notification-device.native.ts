import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { Producto } from '@/types/products';
import { NOTIFICATION_LEDGER_KEY, NOTIFICATION_SCOPE, type PushConfig, type PushPayload } from '@/types/notifications';
import { notificationPlan, readNotificationLedger } from '@/utils/notification-plan';
import { dateKey } from '@/utils/dates';

let initialized = false;
async function notifications() {
  const api = await import('expo-notifications');
  if (!initialized) {
    api.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
    initialized = true;
  }
  return api;
}

export function remoteCapability() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return { available: false, reason: 'Para recibir push remotas debes instalar una versión propia de Surtío. En Expo Go puedes activar avisos locales.' };
  if (!(Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID)) return { available: false, reason: 'La versión instalada todavía no tiene configurado el servicio de push.' };
  return { available: true };
}

export async function requestLocalPermission() {
  const api = await notifications();
  if (Platform.OS === 'android') await api.setNotificationChannelAsync(NOTIFICATION_SCOPE, { name: 'Vencimientos de productos', importance: api.AndroidImportance.DEFAULT, sound: 'default' });
  let permission = await api.getPermissionsAsync();
  if (!permission.granted && permission.ios?.status !== api.IosAuthorizationStatus.PROVISIONAL) permission = await api.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  if (!permission.granted && permission.ios?.status !== api.IosAuthorizationStatus.PROVISIONAL) throw new Error('Permite las notificaciones de Surtío en los ajustes del teléfono.');
}

export async function createPushPayload(config: PushConfig): Promise<PushPayload> {
  const capability = remoteCapability();
  if (!capability.available) throw new Error(capability.reason);
  if (!config.expoEnabled) throw new Error('El negocio todavía no tiene habilitado el envío de push para móviles.');
  const api = await notifications();
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const token = (await api.getExpoPushTokenAsync({ projectId })).data;
  return { kind: 'expo', token, platform: Platform.OS === 'ios' ? 'ios' : 'android' };
}

export async function syncLocalNotifications(products: Producto[], owner: string, now = new Date()): Promise<number> {
  const api = await notifications(), permission = await api.getPermissionsAsync();
  if (!permission.granted && permission.ios?.status !== api.IosAuthorizationStatus.PROVISIONAL) throw new Error('Los avisos no tienen permiso. Revisa los ajustes del teléfono.');
  const plan = notificationPlan(products, owner, now);
  const scheduled = (await api.getAllScheduledNotificationsAsync()).filter(item => item.content.data?.scope === NOTIFICATION_SCOPE);
  const ledger = readNotificationLedger(await AsyncStorage.getItem(NOTIFICATION_LEDGER_KEY));
  const retained = new Set(plan.map(day => day.id));
  for (const item of scheduled) if (!retained.has(item.identifier)) await api.cancelScheduledNotificationAsync(item.identifier);
  for (const day of plan) {
    const previous = scheduled.find(item => item.identifier === day.id);
    if (day.at === null && ledger[day.id]) continue;
    if (previous && previous.content.data?.signature === day.signature) continue;
    if (previous) await api.cancelScheduledNotificationAsync(previous.identifier);
    await api.scheduleNotificationAsync({ identifier: day.id, content: { title: 'Surtío · Alertas de vencimiento', body: day.body, sound: 'default', data: { scope: NOTIFICATION_SCOPE, url: '/alerts', signature: day.signature } }, trigger: day.at === null ? { channelId: NOTIFICATION_SCOPE } : { type: api.SchedulableTriggerInputTypes.DATE, date: new Date(day.at), channelId: NOTIFICATION_SCOPE } });
    ledger[day.id] = day.signature;
  }
  const active = Object.fromEntries(Object.entries(ledger).filter(([id]) => retained.has(id) || id === `surtio-expiry:${owner}:${dateKey(now)}`));
  await AsyncStorage.setItem(NOTIFICATION_LEDGER_KEY, JSON.stringify(active));
  return plan.length;
}

export async function clearDeviceNotifications() {
  const api = await notifications();
  for (const item of await api.getAllScheduledNotificationsAsync()) if (item.content.data?.scope === NOTIFICATION_SCOPE) await api.cancelScheduledNotificationAsync(item.identifier);
  for (const item of await api.getPresentedNotificationsAsync()) if (item.request.content.data?.scope === NOTIFICATION_SCOPE) await api.dismissNotificationAsync(item.request.identifier);
}

export async function releasePushDevice() { /* Native tokens are revoked through the authenticated server registration. */ }
export async function watchNotificationOpens(callback: () => void): Promise<() => void> {
  const api = await notifications();
  const open = (response: import('expo-notifications').NotificationResponse) => {
    if (response.notification.request.content.data?.scope === NOTIFICATION_SCOPE && response.notification.request.content.data?.url === '/alerts') {
      callback();
      void api.clearLastNotificationResponseAsync();
    }
  };
  const previous = api.getLastNotificationResponse();
  if (previous) open(previous);
  const subscription = api.addNotificationResponseReceivedListener(open);
  return () => subscription.remove();
}

export async function testNotification() {
  await requestLocalPermission();
  const api = await notifications();
  await api.scheduleNotificationAsync({ content: { title: 'Surtío · Aviso de prueba', body: 'Los avisos están permitidos en este teléfono.', data: { scope: NOTIFICATION_SCOPE, url: '/alerts' } }, trigger: { channelId: NOTIFICATION_SCOPE } });
}
