import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProductCategory } from '@/constants/product-categories';
import type { Producto } from '@/types/products';
import { categoryOverrides, isProductCategory } from '@/utils/product-categories';

async function storageKey() {
  // Product IDs plus account identity separate local choices between merchants.
  const cached = await AsyncStorage.getItem('surtio.user');
  try {
    const user = JSON.parse(cached ?? '{}');
    const identity = typeof user.id === 'string' && user.id ? user.id : typeof user.phone === 'string' ? user.phone : '';
    if (identity) return `surtio.product-categories.${encodeURIComponent(identity)}`;
  } catch { /* Older sessions may not have a cached profile. */ }
  // IDs are still scoped per product. No credentials are persisted in this key.
  return 'surtio.product-categories.legacy';
}
export async function applyStoredCategories(products: Producto[]): Promise<Producto[]> {
  try {
    const overrides = categoryOverrides(await AsyncStorage.getItem(await storageKey()));
    return products.map(product => overrides[product._id] ? { ...product, categoria: overrides[product._id] } : product);
  } catch { return products; }
}
let writes: Promise<unknown> = Promise.resolve();
export function saveProductCategory(productId: string, category: ProductCategory): Promise<void> {
  const save = async () => {
    if (!productId || !isProductCategory(category)) throw new Error('Selecciona una categoría válida.');
    const key = await storageKey(), overrides = categoryOverrides(await AsyncStorage.getItem(key));
    await AsyncStorage.setItem(key, JSON.stringify({ ...overrides, [productId]: category }));
  };
  const next = writes.then(save, save); writes = next.catch(() => {}); return next;
}
