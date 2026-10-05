import Ionicons from '@/components/ui/business-icon';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import { calendarDays, dateKey, formatDate, parseDate } from '@/utils/dates';

type Props = { label: string; value: string; onChange: (date: string) => void; minDate?: string; maxDate?: string; style?: StyleProp<ViewStyle> };

export default function DatePicker({ label, value, onChange, minDate, maxDate, style }: Props) {
  const t = useSurtioTheme(), s = useSurtioStyles(businessStyles);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parseDate(value) ?? new Date());
  const [selected, setSelected] = useState(value);
  const show = () => {
    let initial = value || dateKey();
    if (minDate && initial < minDate) initial = minDate;
    if (maxDate && initial > maxDate) initial = maxDate;
    setSelected(initial); setMonth(parseDate(initial) ?? new Date()); setOpen(true);
  };
  const allowed = (date: string) => (!minDate || date >= minDate) && (!maxDate || date <= maxDate);
  const move = (delta: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1, 12));
  return <View style={[{ gap: 8 }, style]}>
    <Text style={s.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value ? formatDate(value) : 'Seleccionar fecha'}`} onPress={show} style={[s.input, s.row, { justifyContent: 'space-between' }]}>
      <Text style={[s.text, { flex: 1 }]}>{value ? formatDate(value) : 'Seleccionar fecha'}</Text><Ionicons name="calendar-outline" size={22} color={t.primary} />
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, justifyContent: 'center' }}>
        <ScrollView style={{ flexGrow: 0, maxHeight: '95%', width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: t.card, borderRadius: 18 }} contentContainerStyle={{ padding: 16, gap: 18 }}>
          <View accessibilityViewIsModal style={{ gap: 18 }}>
            <Text accessibilityRole="header" style={s.heading}>{label}</Text>
            <View style={[s.row, { flexWrap: 'nowrap', justifyContent: 'space-between' }]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" onPress={() => move(-1)} style={{ padding: 12 }}><Ionicons name="chevron-back" color={t.primary} size={22} /></Pressable>
              <Text style={[s.text, { textAlign: 'center', flex: 1, fontWeight: '700' }]}>{month.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" onPress={() => move(1)} style={{ padding: 12 }}><Ionicons name="chevron-forward" color={t.primary} size={22} /></Pressable>
            </View>
            <View style={{ flexDirection: 'row' }}>{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => <Text key={index} style={[s.label, { width: '14.2857%', textAlign: 'center' }]}>{day}</Text>)}</View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {calendarDays(month.getFullYear(), month.getMonth()).map((day, index) => day ? <Pressable key={day} accessibilityRole="button" accessibilityLabel={formatDate(day)} accessibilityState={{ selected: day === selected, disabled: !allowed(day) }} disabled={!allowed(day)} onPress={() => setSelected(day)} style={{ width: '14.2857%', minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: day === selected ? t.button : 'transparent', opacity: allowed(day) ? 1 : 0.3, borderWidth: day === dateKey() ? 1 : 0, borderColor: t.primary }}>
                <Text style={{ color: day === selected ? '#FFFFFF' : t.text, fontWeight: day === selected ? '700' : '400' }}>{Number(day.slice(-2))}</Text>
              </Pressable> : <View key={`empty-${index}`} style={{ width: '14.2857%', minHeight: 44 }} />)}
            </View>
            <Text style={s.muted}>{selected ? formatDate(selected) : 'Selecciona un día'}</Text>
            <View style={s.row}>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={[s.button, { flex: 1, backgroundColor: t.muted }]}><Text style={s.text}>Cancelar</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={!selected || !allowed(selected)} onPress={() => { onChange(selected); setOpen(false); }} style={[s.button, { flex: 1, opacity: selected && allowed(selected) ? 1 : 0.5 }]}><Text style={s.buttonText}>Elegir fecha</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </View>;
}
