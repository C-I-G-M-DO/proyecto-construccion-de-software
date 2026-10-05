import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { NotificationPreferences } from '@/types/notifications';
import type { Producto } from '@/types/products';
import { disableNotifications, enableLocalNotifications, enablePushNotifications, notificationsOff, restoreNotifications, synchronizeNotifications, testNotification, watchNotificationOpens } from '@/services/notifications';

type NotificationContextValue = {
  preferences: NotificationPreferences; busy: boolean; message: string | null;
  enableLocal: () => Promise<void>; enablePush: () => Promise<void>; disable: () => Promise<void>;
  test: () => Promise<void>; synchronize: (products: Producto[]) => void;
};
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname(), navigation = useRootNavigationState();
  const [preferences, setPreferences] = useState(notificationsOff), [busy, setBusy] = useState(false), [message, setMessage] = useState<string | null>(null), [openAlerts, setOpenAlerts] = useState(false);
  const alive = useRef(true), busyRef = useRef(false), revision = useRef(0);
  const report = useCallback((error: unknown) => { if (alive.current) setMessage(error instanceof Error ? error.message : 'No pudimos actualizar los avisos. Inténtalo de nuevo.'); }, []);
  const refresh = useCallback(async () => {
    const version = ++revision.current;
    try {
      const value = await restoreNotifications();
      if (!alive.current || version !== revision.current) return;
      setPreferences(value);
      if (value.mode === 'local') await synchronizeNotifications();
    } catch (error) { if (version === revision.current) report(error); }
  }, [report]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; revision.current++; }; }, []);
  useEffect(() => { void refresh(); }, [pathname, refresh]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => subscription.remove();
  }, [refresh]);
  useEffect(() => {
    if (preferences.mode !== 'local') return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const now = new Date(), tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(() => { void refresh(); schedule(); }, tomorrow.getTime() - now.getTime() + 100);
    };
    // A Web session left open overnight must also refresh the next day's notices.
    schedule();
    return () => clearTimeout(timer);
  }, [preferences.mode, refresh]);
  useEffect(() => {
    let active = true, cleanup: (() => void) | undefined;
    // Subscribe only when avisos are enabled; Expo Go does not need a remote token on launch.
    if (preferences.mode !== 'off') void watchNotificationOpens(() => { if (active) setOpenAlerts(true); }).then(value => { if (active) cleanup = value; else value(); }).catch(report);
    return () => { active = false; cleanup?.(); };
  }, [preferences.mode, report]);
  useEffect(() => {
    if (!openAlerts || !navigation?.key) return;
    setOpenAlerts(false);
    void AsyncStorage.getItem('token').then(token => { if (alive.current) router.navigate(token ? '/alerts' : '/login'); }).catch(report);
  }, [openAlerts, navigation?.key, report]);
  async function act(action: () => Promise<NotificationPreferences | void>) {
    if (busyRef.current) return;
    busyRef.current = true; revision.current++; setBusy(true); setMessage(null);
    try { const result = await action(); if (alive.current) setPreferences(result ?? await restoreNotifications()); }
    catch (error) { report(error); if (alive.current) setPreferences(await restoreNotifications().catch(() => notificationsOff)); }
    finally { busyRef.current = false; if (alive.current) setBusy(false); }
  }
  const synchronize = useCallback((products: Producto[]) => { void synchronizeNotifications(products).catch(report); }, [report]);
  return <NotificationContext.Provider value={{ preferences, busy, message, enableLocal: () => act(enableLocalNotifications), enablePush: () => act(enablePushNotifications), disable: () => act(disableNotifications), test: () => act(testNotification), synchronize }}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('Las notificaciones requieren NotificationProvider.');
  return value;
}
