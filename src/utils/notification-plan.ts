import type { Producto } from '@/types/products';
import type { NotificationDay, NotificationLedger } from '@/types/notifications';
import { dateKey } from './dates';
import { expiryAlerts } from './expiry';

export function readNotificationLedger(raw: string | null): NotificationLedger {
  try {
    const data = JSON.parse(raw ?? '{}');
    if (data && typeof data === 'object' && !Array.isArray(data)) return Object.fromEntries(Object.entries(data).filter(([, value]) => typeof value === 'string')) as NotificationLedger;
  } catch { /* A corrupt cache must not block confirmed expiry data. */ }
  return {};
}

// Cache identity only: the backend still verifies the JWT for every registration.
export function notificationOwner(token: string): string {
  let left = 2166136261, right = 3339675911;
  for (let index = 0; index < token.length; index++) {
    left = Math.imul(left ^ token.charCodeAt(index), 16777619);
    right = Math.imul(right ^ token.charCodeAt(index), 2246822519);
  }
  return `${(left >>> 0).toString(16)}${(right >>> 0).toString(16)}`;
}

/** One daily summary at 09:00, using only confirmed lots; at most 30 scheduled notices. */
export function notificationPlan(products: Producto[], owner: string, now = new Date()): NotificationDay[] {
  const plan: NotificationDay[] = [];
  for (let offset = 0; offset < 30; offset++) {
    const delivery = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 9);
    const alerts = expiryAlerts(products, delivery).filter(lot => lot.estado !== 'vigente');
    if (!alerts.length) continue;
    const expired = alerts.filter(lot => lot.estado === 'vencido').length;
    const soon = alerts.length - expired;
    const date = dateKey(delivery);
    const parts = [expired ? `${expired} lote${expired === 1 ? '' : 's'} vencido${expired === 1 ? '' : 's'}` : '', soon ? `${soon} lote${soon === 1 ? '' : 's'} por vencer` : ''].filter(Boolean);
    plan.push({ id: `surtio-expiry:${owner}:${date}`, date, at: delivery.getTime() > now.getTime() ? delivery.getTime() : null, body: `${parts.join(' y ')}. Revisa Alertas en Surtío.`, signature: JSON.stringify(alerts.map(lot => [lot.id, lot.fechaVencimiento, lot.cantidad, lot.estado]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))) });
  }
  return plan;
}
