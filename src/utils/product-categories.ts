import { PRODUCT_CATEGORIES, type ProductCategory } from '../constants/product-categories';
import type { Producto } from '../types/products';

export const normalizedText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const isProductCategory = (value: unknown): value is ProductCategory => PRODUCT_CATEGORIES.some(item => item.id === value);
/** Suggestions for old, uncategorized products; explicit categories always win. */
export function productCategory(product: Pick<Producto, 'nombre' | 'categoria'>): ProductCategory {
  if (isProductCategory(product.categoria)) return product.categoria;
  const name = normalizedText(product.nombre);
  const rules: [ProductCategory, RegExp][] = [
    ['limpieza', /\b(detergente|cloro|suavizante|lavaplatos|desinfectante|limpiador)\b/],
    ['higiene', /\b(champu|shampoo|pasta dental|cepillo|desodorante|papel higienico|jabon)\b/],
    ['lacteos', /\b(leches?|yogur(?:t|es|ts)?|quesos?|mantequilla|crema de leche)\b/],
    ['embutidos', /\b(salami|salchichas?|salchichon(?:es)?|jamon(?:es)?|tocineta|longaniza)\b/],
    ['bebidas', /\b(aguas?|refrescos?|jugos?|cervezas?|ron|vinos?|sodas?|bebidas?|malta)\b/],
    ['panaderia', /\b(pan|panes|galletas?|bizcochos?|snacks?|papitas?|tostadas?)\b/],
    ['viveres', /\b(arroz|habichuelas?|aceites?|azucar|sal|cafe|harina|pastas?|huevos?|platanos?|yuca|avena|sazon|sopitas?)\b/],
  ];
  // Pan de agua is bakery; category priority avoids classifying it as a drink.
  if (/\bpan\b/.test(name)) return 'panaderia';
  return rules.find(([, pattern]) => pattern.test(name))?.[0] ?? 'otros';
}
export function filterProducts(products: Producto[], category: ProductCategory | 'todos', query = ''): Producto[] {
  const search = normalizedText(query);
  return products.filter(product => (category === 'todos' || productCategory(product) === category) && normalizedText(product.nombre).includes(search));
}
export function categoryOverrides(raw: string | null): Record<string, ProductCategory> {
  try {
    const value = JSON.parse(raw ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([key, category]) => key.length > 0 && isProductCategory(category))) as Record<string, ProductCategory>;
  } catch { return {}; }
}
