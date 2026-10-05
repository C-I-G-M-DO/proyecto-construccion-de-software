import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTIFICATION_REVOCATIONS_KEY, type PushConfig, type PushPayload, type PushRegistration } from '@/types/notifications';

export function remoteNotificationsConfigured() {
  return !!process.env.EXPO_PUBLIC_NOTIFICATIONS_URL?.trim();
}

async function request(path: string, options: RequestInit = {}, authenticated = true) {
  const base = process.env.EXPO_PUBLIC_NOTIFICATIONS_URL?.trim().replace(/\/$/, '');
  if (!base) throw new Error('Las notificaciones push necesitan conectar el servicio de avisos del negocio.');
  const token = authenticated ? await AsyncStorage.getItem('token') : null;
  if (authenticated && !token) throw new Error('Inicia sesión para activar las notificaciones.');
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base}${path}`, { ...options, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
    if (!authenticated && [404, 410].includes(response.status)) return null;
    if (!response.ok) throw new Error(response.status === 401 ? 'Tu sesión venció. Inicia sesión nuevamente.' : 'No pudimos conectar las notificaciones. Inténtalo de nuevo.');
    return response.status === 204 ? null : await response.json();
  } finally { clearTimeout(timer); }
}

export async function notificationConfig(): Promise<PushConfig> {
  const data = await request('/config');
  if (typeof data?.expoEnabled !== 'boolean' || typeof data?.webEnabled !== 'boolean') throw new Error('El servicio de avisos devolvió una configuración incompleta.');
  return data;
}

export async function registerPush(payload: PushPayload): Promise<PushRegistration> {
  const data = await request('/subscriptions', { method: 'POST', body: JSON.stringify(payload) });
  if (typeof data?.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(data.id) || typeof data?.revokeToken !== 'string' || !/^[a-zA-Z0-9_-]{32,256}$/.test(data.revokeToken)) throw new Error('El servidor no confirmó el registro de este dispositivo.');
  return { id: data.id, revokeToken: data.revokeToken };
}

let queueOperation: Promise<unknown> = Promise.resolve();
function updateQueue(change: (queue: PushRegistration[]) => PushRegistration[]) {
  const next = queueOperation.then(async () => {
  const raw = await AsyncStorage.getItem(NOTIFICATION_REVOCATIONS_KEY);
  let queue: PushRegistration[] = [];
  try { const data = JSON.parse(raw ?? '[]'); if (Array.isArray(data)) queue = data.filter(item => item && typeof item.id === 'string' && typeof item.revokeToken === 'string'); } catch { /* Retain the current revocation even if an old cache is corrupt. */ }
  const updated = change(queue);
  await AsyncStorage.setItem(NOTIFICATION_REVOCATIONS_KEY, JSON.stringify(updated));
  return updated;
  });
  queueOperation = next.catch(() => {});
  return next;
}

// A limited revocation credential lets logout retry without retaining the user's JWT.
export async function queuePushRevocation(registration: PushRegistration) {
  await updateQueue(queue => [...queue.filter(item => item.id !== registration.id), registration]);
}

let flushing: Promise<void> | null = null;
export function flushPushRevocations(): Promise<void> {
  if (!remoteNotificationsConfigured()) return Promise.resolve();
  if (flushing) return flushing;
  flushing = (async () => {
    // Remove each item from the latest queue so a concurrent logout is not lost.
    const queue = await updateQueue(queue => queue);
    for (const item of queue) {
      try {
        await request(`/subscriptions/${encodeURIComponent(item.id)}`, { method: 'DELETE', headers: { 'X-Surtio-Notification-Revoke': item.revokeToken } }, false);
        await updateQueue(latest => latest.filter(value => value.id !== item.id || value.revokeToken !== item.revokeToken));
      } catch { break; }
    }
  })().finally(() => { flushing = null; });
  return flushing;
}
