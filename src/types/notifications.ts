export type NotificationMode = 'off' | 'local' | 'push';
export type PushConfig = { expoEnabled: boolean; webEnabled: boolean; vapidPublicKey?: string };
export type PushPayload = { kind: 'expo'; token: string; platform: 'ios' | 'android' } | { kind: 'web'; subscription: PushSubscriptionJSON };
export type PushRegistration = { id: string; revokeToken: string };
export type NotificationPreferences = { mode: NotificationMode; owner: string; registration?: PushRegistration };
export type NotificationDay = { id: string; date: string; at: number | null; signature: string; body: string };
export type NotificationLedger = Record<string, string>;

export const NOTIFICATION_SCOPE = 'surtio-expiry';
export const NOTIFICATION_PREFERENCES_KEY = 'surtio.notifications';
export const NOTIFICATION_LEDGER_KEY = 'surtio.notifications.days';
export const NOTIFICATION_REVOCATIONS_KEY = 'surtio.notifications.revocations';
