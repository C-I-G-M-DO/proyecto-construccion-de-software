import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRODUCT_CATEGORIES, categoryLabel, type ProductCategory } from '@/constants/product-categories';
import { useSurtioStyles, useSurtioTheme } from '@/hooks/use-surtio-theme';
import { businessStyles } from '@/styles/business.styles';
import type { Producto } from '@/types/products';
import { productCategory } from '@/utils/product-categories';

export function CategoryPicker({ value, onChange }: { value: ProductCategory; onChange: (value: ProductCategory) => void }) {
  const s = useSurtioStyles(businessStyles), t = useSurtioTheme(), [open, setOpen] = useState(false);
  return <View style={{ gap: 8 }}><Text style={s.label}>Categoría</Text><Pressable accessibilityRole="button" accessibilityLabel={`Categoría: ${categoryLabel(value)}`} onPress={() => setOpen(true)} style={s.input}><Text style={s.text}>{categoryLabel(value)} ▾</Text></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'center', padding: 16 }}><ScrollView style={{ flexGrow: 0, maxHeight: '90%', maxWidth: 440, width: '100%', alignSelf: 'center', borderRadius: 18, backgroundColor: t.card }} contentContainerStyle={{ padding: 20, gap: 8 }}><View accessibilityViewIsModal style={{ gap: 8 }}><Text accessibilityRole="header" style={s.heading}>Elegir categoría</Text>{PRODUCT_CATEGORIES.map(category => <Pressable key={category.id} accessibilityRole="button" accessibilityState={{ selected: value === category.id }} onPress={() => { onChange(category.id); setOpen(false); }} style={[s.chip, { borderRadius: 10, backgroundColor: value === category.id ? t.button : t.muted }]}><Text style={value === category.id ? s.buttonText : s.text}>{category.label}</Text></Pressable>)}<Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={s.button}><Text style={s.buttonText}>Cerrar categorías</Text></Pressable></View></ScrollView></SafeAreaView></Modal>
  </View>;
}

export function ProductCategoryFilter({ products, value, onChange }: { products: Producto[]; value: ProductCategory | 'todos'; onChange: (value: ProductCategory | 'todos') => void }) {
  const t = useSurtioTheme(), s = useSurtioStyles(businessStyles);
  const choices = [{ id: 'todos' as const, label: 'Todos', count: products.length }, ...PRODUCT_CATEGORIES.map(category => ({ ...category, count: products.filter(product => productCategory(product) === category.id).length })).filter(category => category.count > 0 || category.id === value)];
  return <View style={{ gap: 8 }}><Text style={s.label}>Categorías</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>{choices.map(choice => <Pressable key={choice.id} accessibilityRole="button" accessibilityLabel={`Filtrar ${choice.label}`} accessibilityState={{ selected: value === choice.id }} onPress={() => onChange(choice.id)} style={[s.chip, { backgroundColor: value === choice.id ? t.button : t.muted }]}><Text style={value === choice.id ? s.buttonText : s.text}>{choice.label} · {choice.count}</Text></Pressable>)}</ScrollView></View>;
}
