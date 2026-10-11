export const PRODUCT_CATEGORIES = [
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'viveres', label: 'Víveres y abarrotes' },
  { id: 'lacteos', label: 'Lácteos' },
  { id: 'embutidos', label: 'Embutidos' },
  { id: 'panaderia', label: 'Panadería y snacks' },
  { id: 'limpieza', label: 'Limpieza' },
  { id: 'higiene', label: 'Higiene personal' },
  { id: 'otros', label: 'Otros' },
] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number]['id'];
export const categoryLabel = (id: string) => PRODUCT_CATEGORIES.find(item => item.id === id)?.label ?? 'Otros';
