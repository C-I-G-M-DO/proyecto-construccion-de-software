import { router, Slot, usePathname } from 'expo-router';
import {
    Pressable,
    Text,
    TextInput,
    useWindowDimensions,
    View
} from 'react-native';

import { styles } from '@/styles/ashboard-layout.styles.web';

const NAVIGATION = [
  { label: 'Inicio', icon: '⌂', route: '/home', enabled: true },
  { label: 'Ventas', icon: '$', enabled: false },
  { label: 'Inventario', icon: '□', enabled: false },
  { label: 'Pedidos', icon: '▱', enabled: false },
  { label: 'Cuentas de fiao', icon: '▤', enabled: false },
  { label: 'Clientes', icon: '◎', enabled: false },
  { label: 'Reportes', icon: '▥', enabled: false },
] as const;

export default function WebTabsLayout() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const compact = width < 950;

  function handleLogout() {
    // El backend podrá borrar el token aquí posteriormente.
    router.replace('/login');
  }

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
                (pathname === item.route ||
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
              <Text style={styles.helpText}>Ayuda</Text>
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
                accessibilityLabel="Cerrar sesión"
                accessibilityRole="button"
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.logoutText}>↪</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <View style={styles.workspace}>
        <View style={styles.topbar}>
          {compact && (
            <View style={styles.compactBrand}>
              <View style={styles.compactLogo}>
                <Text style={styles.compactLogoText}>S</Text>
              </View>

              <Text style={styles.compactBrandText}>Surtío</Text>
            </View>
          )}

          <View
            style={[
              styles.searchContainer,
              compact && styles.searchContainerCompact,
            ]}
          >
            <Text style={styles.searchIcon}>⌕</Text>

            <TextInput
              accessibilityLabel="Buscar"
              placeholder="Buscar producto, fiao o cliente..."
              placeholderTextColor="#806F6C"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.topbarActions}>
            <Pressable style={styles.iconButton}>
              <Text style={styles.actionIcon}>♧</Text>
            </Pressable>

            <Pressable style={styles.iconButton}>
              <Text style={styles.actionIcon}>▥</Text>
            </Pressable>

            <View style={styles.topbarSeparator} />

            <Pressable style={styles.profileButton}>
              <Text style={styles.profileIcon}>U</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

