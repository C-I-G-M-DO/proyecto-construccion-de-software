import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { PropsWithChildren } from 'react';

export function DemoButton({ label, onPress, disabled = false, secondary = false }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  const s = useSurtioStyles(businessStyles), t = useSurtioTheme();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, secondary && { backgroundColor: t.muted }, { opacity: disabled ? 0.5 : 1, maxWidth: '100%' }]}><Text style={[secondary ? s.text : s.buttonText, { textAlign: 'center' }]}>{label}</Text></Pressable>;
}

export default function DemoDialog({ title, onClose, children }: PropsWithChildren<{ title: string; onClose: () => void }>) {
  const s = useSurtioStyles(businessStyles), t = useSurtioTheme();
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.55)', justifyContent: 'center', padding: 16 }}>
      <ScrollView style={{ flexGrow: 0, maxHeight: '95%', width: '100%', maxWidth: 560, alignSelf: 'center', borderRadius: 18, backgroundColor: t.card }} contentContainerStyle={{ padding: 20, gap: 18 }}>
        <View accessibilityViewIsModal style={{ gap: 18 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Text accessibilityRole="header" style={[s.heading, { flex: 1 }]}>{title}</Text><DemoButton label="Cerrar" onPress={onClose} secondary /></View>{children}</View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
