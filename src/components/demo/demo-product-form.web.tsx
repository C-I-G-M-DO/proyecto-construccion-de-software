import { useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import DemoDialog, { DemoButton } from './demo-dialog';
import DatePicker from '@/components/ui/date-picker';
import { MEDIDAS, type TipoMedida } from '@/constants/measures';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { Producto } from '@/types/products';
import { dateKey } from '@/utils/dates';
import { initialLots } from '@/utils/expiry';
import { CategoryPicker } from '@/components/product-category-controls';
import type { ProductCategory } from '@/constants/product-categories';
import { productCategory } from '@/utils/product-categories';

export default function DemoProductForm({ product, onClose, onSave }: { product?: Producto; onClose: () => void; onSave: (product: Producto) => void }) {
  const s = useSurtioStyles(businessStyles), t = useSurtioTheme();
  const [name, setName] = useState(product?.nombre ?? '');
  const [category, setCategory] = useState<ProductCategory>(() => product ? productCategory(product) : 'otros');
  const [price, setPrice] = useState(product ? String(product.precios[0].valor) : '');
  const [measure, setMeasure] = useState<TipoMedida>(product?.precios[0].tipo ?? 'unidad');
  const [quantity, setQuantity] = useState(''), [equivalence, setEquivalence] = useState('');
  const [expires, setExpires] = useState(false), [expiry, setExpiry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const unit = MEDIDAS.find(item => item.tipo === measure)!.unidadStock;
  const number = (value: string) => Number(value.replace(',', '.'));
  function save() {
    try {
      if (!name.trim()) throw new Error('Escribe el nombre del producto.');
      if (!price.trim() || !Number.isFinite(number(price)) || number(price) <= 0) throw new Error('Escribe un precio mayor que cero.');
      if (product) { onSave({ ...product, nombre: name.trim(), categoria: category, precios: product.precios.map((item, index) => index ? item : { ...item, valor: number(price) }) }); return; }
      const stock = number(quantity);
      if (!quantity.trim() || !Number.isFinite(stock) || stock < 0 || (unit === 'unidad' && !Number.isInteger(stock))) throw new Error('Indica existencias válidas en la unidad base.');
      if (measure === 'paquete' && (!Number.isInteger(number(equivalence)) || number(equivalence) <= 0)) throw new Error('Indica cuántas unidades contiene el paquete.');
      const lots = initialLots(expires, expiry, stock);
      onSave({ _id: `demo-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, nombre: name.trim(), categoria: category, imagen: '', unidadStock: unit, stock,
        precios: [{ tipo: measure, valor: number(price), ...(measure === 'paquete' ? { equivalencia: number(equivalence) } : {}) }],
        ...(lots ? { lotes: lots.map(lot => ({ cantidadDisponible: lot.cantidad, fechaVencimiento: lot.fechaVencimiento })) } : {}) });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Revisa los datos del producto.'); }
  }
  const field = (label: string, value: string, change: (value: string) => void, numeric = false) => <View style={{ gap: 8 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={s.input} placeholderTextColor={t.secondary} value={value} onChangeText={change} keyboardType={numeric ? 'decimal-pad' : 'default'} maxLength={numeric ? 12 : 100} /></View>;
  return <DemoDialog title={product ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
    {field('Nombre del producto', name, setName)}
    <CategoryPicker value={category} onChange={setCategory} />
    <View style={{ gap: 8 }}><Text nativeID="demo-measure-label" style={s.label}>Presentación de venta</Text><select aria-labelledby="demo-measure-label" value={measure} disabled={!!product} onChange={event => setMeasure(event.target.value as TipoMedida)} style={{ minHeight: 48, padding: 12, borderRadius: 12, border: `1px solid ${t.border}`, background: t.background, color: t.text, fontSize: 15, width: '100%' }}>{MEDIDAS.map(item => <option key={item.tipo} value={item.tipo}>{item.nombre}</option>)}</select></View>
    {field('Precio de venta (RD$)', price, setPrice, true)}
    {!product && <>
      {measure === 'paquete' && field('Unidades por paquete', equivalence, setEquivalence, true)}
      {field(unit === 'libra' ? 'Existencias iniciales (lb)' : 'Existencias iniciales (unidades)', quantity, setQuantity, true)}
      <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.text}>Este producto vence</Text><Switch accessibilityLabel="Este producto vence" value={expires} onValueChange={setExpires} trackColor={{ true: t.button }} /></View>
      {expires && <DatePicker label="Fecha de vencimiento" value={expiry} minDate={dateKey()} onChange={setExpiry} />}
      {expires && <Text style={s.muted}>El vencimiento corresponde a toda la cantidad inicial registrada.</Text>}
    </>}
    {product && <Text style={s.muted}>Las existencias se actualizan al confirmar el despacho.</Text>}
    {error && <Text accessibilityRole="alert" style={s.link}>{error}</Text>}
    <DemoButton label={product ? 'Guardar cambios' : 'Guardar producto'} onPress={save} />
  </DemoDialog>;
}
