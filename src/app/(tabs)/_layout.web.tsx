import { useSurtioTheme, useSurtioStyles } from '@/hooks/use-surtio-theme';
import { router, Slot, usePathname } from 'expo-router';
import {
    Pressable,
    Text,
    useWindowDimensions,
    View
} from 'react-native';

import { styles as baseStyles } from '@/styles/ashboard-layout.styles.web';

const NAVIGATION = [
  { label: 'Inicio', icon: '⌂', route: '/home' },
  { label: 'Historial', icon: '◷', route: '/history' },
  { label: 'Despacho', icon: '▱', route: '/dispatch' },
  { label: 'Reportes', icon: '▥', route: '/reports' },
  { label: 'Perfil', icon: '◎', route: '/profile' },
  { label: 'Carrito', icon: '$', route: '/cart' },
  { label: 'Productos', icon: '□', route: '/products' },
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
                (pathname === item.route ||
                  (item.route === '/home' && pathname === '/'));

              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  onPress={() => router.push(item.route)}
                  style={({ pressed }) => [
                    styles.navigationItem,
                    active && styles.navigationItemActive,
                    pressed && styles.navigationItemPressed,
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

                </Pressable>
              );
            })}
          </View>

          <View style={styles.sidebarFooter}>

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
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 20 }}>Surtío</Text>
            {NAVIGATION.map(item => <Pressable key={item.route} accessibilityRole="button" onPress={() => router.push(item.route)} style={{ padding: 10 }}><Text style={{ color: theme.primary }}>{item.label}</Text></Pressable>)}
          </View> : <>
            <Text style={{ color: theme.secondary, flex: 1 }}>Surtío / {NAVIGATION.find(item => item.route === pathname)?.label ?? 'Inicio'}</Text>
          </>}
        </View>

        <View style={styles.routeContainer}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

