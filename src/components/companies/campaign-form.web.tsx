import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { PRODUCT_CATEGORIES } from '@/constants/product-categories';
import DemoDialog, { DemoButton } from '@/components/demo/demo-dialog';
import DatePicker from '@/components/ui/date-picker';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { Campaign, DemoStore } from '@/types/companies';
import { eligibleStores, validateCampaign } from '@/utils/companies-demo';

export default function CampaignForm({ campaign, stores, today, onClose, onSave }: { campaign?: Campaign; stores: DemoStore[]; today: string; onClose: () => void; onSave: (campaign: Campaign) => void }) {
  const s = useSurtioStyles(businessStyles), t = useSurtioTheme();
  const [draft, setDraft] = useState<Campaign>(campaign ?? { id: `demo-campaign-${Date.now()}`, titulo: '', patrocinador: '', descripcion: '', productoId: stores[0].products[0]._id, zona: 'todas', categoriaAudiencia: 'todos', desde: today, hasta: today, estado: 'borrador' });
  const [error, setError] = useState<string | null>(null);
  const change = (key: keyof Campaign, value: string) => { setDraft(current => ({ ...current, [key]: value })); setError(null); };
  const field = (label: string, key: 'titulo' | 'patrocinador' | 'descripcion') => <View style={{ gap: 6 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={s.input} value={draft[key]} onChangeText={value => change(key, value)} multiline={key === 'descripcion'} maxLength={key === 'descripcion' ? 400 : 100} /></View>;
  const select = (label: string, key: 'productoId' | 'zona' | 'categoriaAudiencia', choices: { id: string; label: string }[]) => <View style={{ gap: 6 }}><Text style={s.label}>{label}</Text><select aria-label={label} value={draft[key]} onChange={event => change(key, event.target.value)} style={{ minHeight: 48, padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.background, color: t.text, fontSize: 15, width: '100%' }}>{choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></View>;
  return <DemoDialog title={campaign ? 'Editar campaña de prueba' : 'Nueva campaña de prueba'} onClose={onClose}>
    {field('Título de la campaña', 'titulo')}{field('Empresa patrocinadora', 'patrocinador')}
    {select('Producto promocionado', 'productoId', stores[0].products.map(product => ({ id: product._id, label: product.nombre })))}
    {field('Descripción del producto', 'descripcion')}
    {select('Zona de la campaña', 'zona', [{ id: 'todas', label: 'Todas las zonas' }, ...[...new Set(stores.map(store => store.zona))].map(zona => ({ id: zona, label: zona }))])}
    {select('Categoría del público', 'categoriaAudiencia', [{ id: 'todos', label: 'Todas las categorías' }, ...PRODUCT_CATEGORIES.map(category => ({ id: category.id, label: category.label }))])}
    <DatePicker label="Inicio de campaña" value={draft.desde} onChange={value => change('desde', value)} /><DatePicker label="Fin de campaña" value={draft.hasta} minDate={draft.desde} onChange={value => change('hasta', value)} />
    <Text style={s.muted}>{eligibleStores(stores, draft).length} colmados ficticios elegibles con autorización para promociones.</Text>
    {error && <Text accessibilityRole="alert" style={s.link}>{error}</Text>}
    <DemoButton label="Guardar campaña de prueba" onPress={() => { const invalid = validateCampaign(draft, stores); if (invalid) setError(invalid); else onSave({ ...draft, titulo: draft.titulo.trim(), patrocinador: draft.patrocinador.trim(), descripcion: draft.descripcion.trim() }); }} />
  </DemoDialog>;
}
