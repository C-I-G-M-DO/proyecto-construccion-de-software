import { Pressable, Text, View } from 'react-native';

import { styles } from '@/styles/dashboard-layout.styles.web';

type NavigationItem = {
  label: string;
  icon: string;
  route?: string;
  enabled: boolean;
};

type DashboardSidebarProps = {
  navigation: readonly NavigationItem[];
  pathname: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  isItemActive: (item: NavigationItem) => boolean;
};

export function DashboardSidebarWeb({
  navigation,
  pathname,
  onNavigate,
  onLogout,
  isItemActive,
}: DashboardSidebarProps) {
  return (
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
        {navigation.map((item) => {
          const active = isItemActive(item);

          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              disabled={!item.enabled}
              onPress={() => {
                if (item.enabled && item.route) {
                  onNavigate(item.route);
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
            onPress={onLogout}
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
  );
}
