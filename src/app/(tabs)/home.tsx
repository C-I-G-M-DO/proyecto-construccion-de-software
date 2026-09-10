import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { styles } from '@/styles/home.styles';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}>
          <ThemedView style={styles.heroSection}>
            <ThemedText type="title" style={styles.title}>
              Surtío
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Tu colmado organizado, siempre surtido.
            </ThemedText>
          </ThemedView>

          <ThemedText type="code" style={styles.tagline}>
            INVENTARIO · VENTAS · PEDIDOS
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.infoCard}>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              Todo en un solo lugar
            </ThemedText>

            <ThemedText type="small" style={styles.cardText}>
              Controla productos, registra ventas y administra pedidos desde tu
              celular.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}