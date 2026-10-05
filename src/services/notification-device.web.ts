import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Producto } from '@/types/products';
import { NOTIFICATION_LEDGER_KEY, NOTIFICATION_SCOPE, type PushConfig, type PushPayload } from '@/types/notifications';
import { notificationPlan, readNotificationLedger } from '@/utils/notification-plan';
import { dateKey } from '@/utils/dates';

export function remoteCapability() {
  if (typeof window === 'undefined' || !window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return { available: false, reason: 'Este navegador necesita una conexión segura y compatibilidad con notificaciones. En iPhone, instala la Web en la pantalla de inicio.' };
  return { available: true };
}

export async function requestLocalPermission() {
  if (typeof window === 'undefined' || !window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator)) throw new Error('Este navegador no permite avisos. Usa HTTPS o localhost en un navegador compatible.');
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permite las notificaciones de Surtío en los ajustes del navegador.');
}

async function worker() {
  const registration = await navigator.serviceWorker.register('/surtio-notifications-sw.js');
  if (registration.active) return registration;
  const candidate = registration.installing ?? registration.waiting;
  if (!candidate) throw new Error('No se pudo preparar el servicio de avisos.');
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { candidate.removeEventListener('statechange', changed); reject(new Error('El servicio de avisos tardó demasiado en iniciar.')); }, 10000);
    function changed() {
      if (candidate!.state === 'activated') { clearTimeout(timer); candidate!.removeEventListener('statechange', changed); resolve(); }
      if (candidate!.state === 'redundant') { clearTimeout(timer); candidate!.removeEventListener('statechange', changed); reject(new Error('No se pudo iniciar el servicio de avisos.')); }
    }
    candidate.addEventListener('statechange', changed); changed();
  });
  return registration;
}

export async function createPushPayload(config: PushConfig): Promise<PushPayload> {
  const capability = remoteCapability();
  if (!capability.available) throw new Error(capability.reason);
  if (!config.webEnabled || typeof config.vapidPublicKey !== 'string') throw new Error('El negocio todavía no tiene habilitado el envío de push para Web.');
  const encoded = config.vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(encoded + '='.repeat((4 - encoded.length % 4) % 4));
  const key = Uint8Array.from(decoded, character => character.charCodeAt(0));
  if (key.length !== 65 || key[0] !== 4) throw new Error('La configuración de push del negocio no es válida.');
  const registration = await worker();
  const existing = await registration.pushManager.getSubscription();
  if (existing && !sameKey(existing.options.applicationServerKey, key)) await existing.unsubscribe();
  const subscription = existing && sameKey(existing.options.applicationServerKey, key) ? existing : await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  return { kind: 'web', subscription: subscription.toJSON() };
}

function sameKey(existing: ArrayBuffer | null, expected: Uint8Array): boolean {
  return !!existing && existing.byteLength === expected.length && new Uint8Array(existing).every((value, index) => value === expected[index]);
}

export async function syncLocalNotifications(products: Producto[], owner: string, now = new Date()): Promise<number> {
  if (Notification.permission !== 'granted') throw new Error('Los avisos no tienen permiso. Revisa los ajustes del navegador.');
  const day = notificationPlan(products, owner, now).find(item => item.date === dateKey(now));
  if (!day) return 0;
  const ledger = readNotificationLedger(await AsyncStorage.getItem(NOTIFICATION_LEDGER_KEY));
  if (ledger[day.id]) return 0;
  await (await worker()).showNotification('Surtío · Alertas de vencimiento', { body: day.body, tag: day.id, icon: '/surtio-icon.png', data: { scope: NOTIFICATION_SCOPE } });
  await AsyncStorage.setItem(NOTIFICATION_LEDGER_KEY, JSON.stringify({ [day.id]: day.signature }));
  return 1;
}

export async function clearDeviceNotifications() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration?.active?.scriptURL.includes('/surtio-notifications-sw.js')) return;
  for (const notification of await registration.getNotifications()) if (notification.data?.scope === 'surtio-expiry') notification.close();
}

export async function releasePushDevice() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (registration?.active?.scriptURL.includes('/surtio-notifications-sw.js')) await (await registration.pushManager.getSubscription())?.unsubscribe();
}

export async function watchNotificationOpens(_callback: () => void): Promise<() => void> { return () => {}; }
export async function testNotification() {
  await requestLocalPermission();
  await (await worker()).showNotification('Surtío · Aviso de prueba', { body: 'Los avisos están permitidos en este navegador.', icon: '/surtio-icon.png', data: { scope: 'surtio-expiry' } });
}
