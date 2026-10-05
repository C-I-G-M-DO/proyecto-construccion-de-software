import Ionicons from '@/components/ui/business-icon';
import { Image, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { useCurrentDay } from '@/hooks/use-current-day';
import { businessStyles } from '@/styles/business.styles';

export function BrandMark({ size = 44 }: { size?: number }) {
  return <Image source={require('../../assets/images/surtio-icon.png')} accessibilityLabel="Surtío" style={{ width: size, height: size, borderRadius: size * 0.22 }} />;
}

export function BusinessDate() {
  const t = useSurtioTheme(), date = useCurrentDay();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 12, padding: 12 }}>
    <Ionicons name="calendar-outline" color={t.primary} size={20} />
    <Text style={{ color: t.secondary, fontSize: 13, fontWeight: '600', flexShrink: 1 }}>{date?.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) ?? 'Fecha actual'}</Text>
  </View>;
}

export function LoadNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const s = useSurtioStyles(businessStyles);
  return <View style={s.card}><Text style={s.muted}>{message}</Text>{onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}><Text style={s.link}>Reintentar</Text></Pressable>}</View>;
}

export function Metric({ label, value, note, style }: { label: string; value: string; note?: string; style?: StyleProp<ViewStyle> }) {
  const s = useSurtioStyles(businessStyles);
  return <View style={[s.card, s.metric, style]}><Text style={s.label}>{label}</Text><Text selectable style={s.metricValue}>{value}</Text>{note && <Text style={s.muted}>{note}</Text>}</View>;
}
