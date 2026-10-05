import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { nombreMedida } from '@/constants/measures';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { Venta } from '@/types/sales';
import { formatMoney } from '@/utils/currency';
import { saleTotal } from '@/utils/history';

export default function SaleCard({ sale, latest = false, compact = false }: { sale: Venta; latest?: boolean; compact?: boolean }) {
  const t = useSurtioTheme(), s = useSurtioStyles(businessStyles);
  const [expanded, setExpanded] = useState(false);
  const date = new Date(sale.createdAt);
  const items = sale.items ?? [];
  return <View style={[s.card, { marginBottom: 12 }, compact && { padding: 16, gap: 8 }]}>
    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <View style={{ flex: 1, minWidth: 130, gap: 6 }}>
        <Text style={[s.heading, { fontSize: 17 }]}>Orden {sale.numeroOrden != null ? `#${sale.numeroOrden}` : 'registrada'}</Text>
        <Text style={s.muted}>{Number.isFinite(date.getTime()) ? date.toLocaleString('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Fecha no disponible'}</Text>
      </View>
      <Text style={[s.heading, { color: t.primary }]}>{formatMoney(saleTotal(sale))}</Text>
    </View>
    {(latest || sale.estado || sale.metodoPago) && <View style={s.row}>
      {latest && <Text style={[s.label, { color: t.primary }]}>Más reciente</Text>}
      {sale.estado && <Text style={[s.label, { backgroundColor: t.muted, padding: 6, borderRadius: 6 }]}>{sale.estado}</Text>}
      {sale.metodoPago && <Text style={s.muted}>Pago: {sale.metodoPago}</Text>}
    </View>}
    {items.length > 0 && <Text numberOfLines={2} style={s.text}>{items.slice(0, 2).map(item => `${item.cantidad} × ${item.nombre}`).join(' · ')}{items.length > 2 ? ` · +${items.length - 2} productos` : ''}</Text>}
    {!compact && items.length > 0 && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(current => !current)} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}><Text style={s.link}>{expanded ? 'Ocultar detalles' : `Ver ${items.length} producto${items.length === 1 ? '' : 's'}`}</Text></Pressable>}
    {expanded && items.map((item, index) => <View key={index} style={{ borderTopWidth: 1, borderColor: t.border, paddingTop: 12, gap: 4 }}><Text style={s.text}>{item.nombre}</Text><Text style={s.muted}>{item.cantidad} × {formatMoney(item.precio)} · {nombreMedida(item.tipo)}</Text><Text style={s.link}>{formatMoney(item.cantidad * item.precio)}</Text></View>)}
  </View>;
}
