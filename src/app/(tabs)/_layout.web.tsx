import { useSurtioTheme, useSurtioStyles } from '@/hooks/use-surtio-theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Slot, usePathname } from 'expo-router';
import {
    Pressable,
    Text,
    useWindowDimensions,
    View
} from 'react-native';

import { styles as baseStyles } from '@/styles/ashboard-layout.styles.web';

const NAVIGATION = [
  { label: 'Inicio', icon: '⌂', route: '/home', enabled: true },
  { label: 'Historial', icon: '◷', route: '/history', enabled: true },
  { label: 'Perfil', icon: '◎', route: '../profile', enabled: true },
  { label: 'Carrito', icon: '$', route: '/cart', enabled: true },
  { label: 'Inventario', icon: '□', enabled: false },
  { label: 'Pedidos', icon: '▱', enabled: false },
  { label: 'Cuentas de fiao', icon: '▤', enabled: false },
  { label: 'Clientes', icon: '◎', enabled: false },
  { label: 'Reportes', icon: '▥', enabled: false },
] as const;

export default function WebTabsLayout() {
  const theme = useSurtioTheme();
  const styles = useSurtioStyles(baseStyles);
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const compact = width < 950;

  return (
    <View style={styles.screen}>
      {!compact && (
        <View style={styles.sidebar}>
          <View style={styles.businessHeader}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>S</Text>
            </View>

            <View style={styles.businessInformation}>
              <Text style={styles.brandName}>Surtío</Text>
              <Text numberOfLines={1} style={styles.businessName}>
                Mi negocio
              </Text>
            </View>

            <View style={styles.posBadge}>
              <Text style={styles.posText}>POS</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.navigation}>
            {NAVIGATION.map((item) => {
              const active =
                item.enabled &&
                (pathname === item.route.replace('..', '') ||
                  (item.route === '/home' && pathname === '/'));

              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  disabled={!item.enabled}
                  onPress={() => {
                    if (item.enabled && item.route) {
                      router.push(item.route);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.navigationItem,
                    active && styles.navigationItemActive,
                    pressed && item.enabled && styles.navigationItemPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.navigationIcon,
                      active && styles.navigationTextActive,
                    ]}
                  >
                    {item.icon}
                  </Text>

                  <Text
                    style={[
                      styles.navigationText,
                      active && styles.navigationTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {!item.enabled && (
                    <View style={styles.soonBadge}>
                      <Text style={styles.soonText}>Próximamente</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sidebarFooter}>
            <Pressable style={styles.helpButton}>
              <Text style={styles.helpIcon}>?</Text>
              <Text style={styles.helpText}>Ayuda · Próximamente</Text>
            </Pressable>

            <View style={styles.accountCard}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarText}>U</Text>
              </View>

              <View style={styles.accountInformation}>
                <Text style={styles.accountName}>Usuario</Text>
                <Text style={styles.accountRole}>Administrador</Text>
              </View>

              <Pressable
                accessibilityLabel="Abrir perfil"
                accessibilityRole="button"
                onPress={() => router.push('../profile')}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.logoutText}>◎</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <View style={styles.workspace}>
        <View style={[styles.topbar, { flexWrap: 'wrap', height: 'auto', minHeight: 64, paddingVertical: 12, gap: 12 }]}>
          {compact ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontWeight: '700', fontSize: 20 }}>Surtío</Text>
            <Pressable onPress={() => router.push('/home')} style={{ padding: 10 }}><Text style={{ color: theme.primary }}>Inicio</Text></Pressable>
            <Pressable onPress={() => router.push('/history')} style={{ padding: 10 }}><Text style={{ color: theme.primary }}>Historial</Text></Pressable>
            <Pressable onPress={() => router.push('../profile')} style={{ padding: 10 }}><Text>Perfil</Text></Pressable>
          </View> : <>
            <Text style={{ color: theme.secondary, flex: 1 }}>Surtío / {pathname === '/history' ? 'Historial de ventas' : 'Inicio'}</Text>
            <Text style={{ color: theme.secondary, fontSize: 12 }}>Notificaciones y escáner · Próximamente</Text>
          </>}
        </View>

        <View style={styles.routeContainer}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

