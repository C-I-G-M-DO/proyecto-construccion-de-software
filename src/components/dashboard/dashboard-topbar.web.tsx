import { Pressable, Text, TextInput, View } from 'react-native';

import { styles } from '@/styles/dashboard-layout.styles.web';

type DashboardTopbarProps = {
  compact: boolean;
};

export function DashboardTopbarWeb({ compact }: DashboardTopbarProps) {
  return (
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
  );
}
