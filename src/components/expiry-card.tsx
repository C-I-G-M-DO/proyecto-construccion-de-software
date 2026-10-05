import Ionicons from '@/components/ui/business-icon';
import { Image, Text, View } from 'react-native';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { ExpiryAlert } from '@/types/expiry';
import { formatDate } from '@/utils/dates';
import { expiryLabel } from '@/utils/expiry';

export default function ExpiryCard({ alert }: { alert: ExpiryAlert }) {
  const t = useSurtioTheme(), s = useSurtioStyles(businessStyles);
  const color = alert.estado === 'vencido' ? t.primary : alert.estado === 'pronto' ? (t.dark ? '#FFD28A' : '#765114') : (t.dark ? '#8DDDB0' : '#247347');
  return <View style={[s.card, { marginBottom: 12 }]}>
    <View style={[s.row, { flexWrap: 'nowrap', alignItems: 'flex-start' }]}>
      {alert.imagen ? <Image source={{ uri: alert.imagen }} style={{ width: 58, height: 58, borderRadius: 12 }} resizeMode="contain" /> : <Ionicons name="cube-outline" color={t.secondary} size={32} />}
      <View style={{ flex: 1, gap: 6 }}><Text style={[s.label, { color }]}>{expiryLabel(alert.diasRestantes)}</Text><Text style={[s.heading, { fontSize: 18 }]}>{alert.nombre}</Text><Text style={s.muted}>{alert.cantidad.toLocaleString('es-DO')} {alert.unidadStock === 'libra' ? 'lb disponibles' : 'unidades disponibles'}</Text></View>
    </View>
    <Text style={s.muted}>Vencimiento · {formatDate(alert.fechaVencimiento)}</Text>
    {alert.estado === 'vencido' && <Text style={s.text}>Retira este lote de la venta y revisa sus existencias.</Text>}
  </View>;
}
