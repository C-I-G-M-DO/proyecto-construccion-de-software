import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTIFICATION_LEDGER_KEY, NOTIFICATION_PREFERENCES_KEY, type NotificationPreferences } from '@/types/notifications';
import type { Producto } from '@/types/products';
import { notificationOwner } from '@/utils/notification-plan';
import { fetchList } from './lists';
import { flushPushRevocations, notificationConfig, queuePushRevocation, registerPush, remoteNotificationsConfigured } from './notification-api';
import * as device from './notification-device';

export const notificationsOff: NotificationPreferences = { mode: 'off', owner: '' };
let operation: Promise<unknown> = Promise.resolve();
function serialize<T>(action: () => Promise<T>): Promise<T> {
  const next = operation.then(action, action);
  operation = next.catch(() => {});
  return next;
}

async function preferences(): Promise<NotificationPreferences> {
  try {
    const value = JSON.parse(await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY) ?? 'null');
    if (value && ['off', 'local', 'push'].includes(value.mode) && typeof value.owner === 'string' && (value.mode !== 'push' || (typeof value.registration?.id === 'string' && typeof value.registration?.revokeToken === 'string'))) return value;
  } catch { /* Invalid stored preferences are treated as disabled. */ }
  return notificationsOff;
}
async function sessionOwner() {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Inicia sesión para activar los avisos.');
  return notificationOwner(token);
}
async function save(value: NotificationPreferences) { await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(value)); return value; }
async function availableProducts() {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
  try { return await fetchList<Producto>('products', controller.signal); }
  finally { clearTimeout(timer); }
}

async function disable(previous: NotificationPreferences) {
  // Persist a retry before discarding a server registration; the user's JWT is never queued.
  if (previous.registration) await queuePushRevocation(previous.registration);
  if (previous.mode !== 'off') { await device.clearDeviceNotifications(); await device.releasePushDevice(); }
  await AsyncStorage.removeItem(NOTIFICATION_LEDGER_KEY);
  await save(notificationsOff);
  void flushPushRevocations().catch(() => {});
  return notificationsOff;
}

export function restoreNotifications() {
  return serialize(async () => {
    const previous = await preferences(), token = await AsyncStorage.getItem('token');
    if (previous.mode !== 'off' && (!token || previous.owner !== notificationOwner(token))) return disable(previous);
    void flushPushRevocations().catch(() => {});
    return previous;
  });
}

export function disableNotifications() { return serialize(async () => disable(await preferences())); }

export function enableLocalNotifications() {
  return serialize(async () => {
    const owner = await sessionOwner();
    await device.requestLocalPermission();
    const products = await availableProducts();
    if (await sessionOwner() !== owner) throw new Error('La sesión cambió. Vuelve a activar los avisos.');
    await disable(await preferences());
    try {
      await device.syncLocalNotifications(products, owner);
      if (await sessionOwner() !== owner) throw new Error('La sesión cambió. Vuelve a activar los avisos.');
      return await save({ mode: 'local', owner });
    } catch (error) {
      await device.clearDeviceNotifications();
      await AsyncStorage.removeItem(NOTIFICATION_LEDGER_KEY);
      throw error;
    }
  });
}

export function enablePushNotifications() {
  return serialize(async () => {
    const capability = device.remoteCapability();
    if (!capability.available) throw new Error(capability.reason);
    if (!remoteNotificationsConfigured()) throw new Error('El negocio todavía no tiene conectado el envío de notificaciones push.');
    const owner = await sessionOwner();
    await device.requestLocalPermission();
    const config = await notificationConfig();
    // Retire the previous registration before obtaining a new revocation credential.
    await disable(await preferences());
    await flushPushRevocations();
    let registration: Awaited<ReturnType<typeof registerPush>> | undefined;
    try {
      const payload = await device.createPushPayload(config);
      registration = await registerPush(payload);
      if (await sessionOwner() !== owner) throw new Error('La sesión cambió. Vuelve a activar las notificaciones.');
      return await save({ mode: 'push', owner, registration });
    } catch (error) {
      if (registration) { await queuePushRevocation(registration); void flushPushRevocations().catch(() => {}); }
      await device.releasePushDevice();
      throw error;
    }
  });
}

export function synchronizeNotifications(products?: Producto[]) {
  return serialize(async () => {
    const current = await preferences();
    if (current.mode !== 'local') return;
    const owner = await sessionOwner();
    if (owner !== current.owner) { await disable(current); return; }
    const available = products ?? await availableProducts();
    if (await sessionOwner() !== owner) return;
    await device.syncLocalNotifications(available, owner);
  });
}

export { remoteCapability, testNotification, watchNotificationOpens } from './notification-device';
export { remoteNotificationsConfigured } from './notification-api';
