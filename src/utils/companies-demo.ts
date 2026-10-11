import type { Campaign, CompaniesDemoState, DemoStore } from '../types/companies';
import { isProductCategory, productCategory } from './product-categories';
import { createDemoState } from './demo';
import { businessTime } from './analytics';
import { dateKey, parseDate } from './dates';

export const COMPANIES_DEMO_KEY = 'surtio.companies-demo.v1';
export function createDemoStores(now = new Date()): DemoStore[] {
  const initial = createDemoState(now);
  const names = [['Colmado La Esquina', 'Santo Domingo Este'], ['Colmado Don Miguel', 'Santo Domingo Este'], ['Colmado Las Palmas', 'Santo Domingo Norte'], ['Colmado El Parque', 'Santiago'], ['Colmado Los Vecinos', 'Santiago']];
  const today = parseDate(businessTime(now.toISOString())!.day)!;
  return names.map(([nombre, zona], storeIndex) => {
    const products = initial.products.map((product, index) => {
      const stock = product.stock + storeIndex * (index + 1);
      return { ...product, stock, categoria: productCategory(product), lotes: product.lotes?.map(lot => ({ ...lot, cantidadDisponible: stock })) };
    });
    const sales = Array.from({ length: 45 }, (_, index) => {
      const day = new Date(today); day.setDate(day.getDate() - Math.floor(index / 2));
      const product = products[(index + storeIndex) % products.length], price = product.precios[0];
      const quantity = 1 + (index * (storeIndex + 1)) % 5;
      const hour = 7 + ((index * 3 + storeIndex * 2) % 15);
      return { _id: `demo-store-${storeIndex}-sale-${index}`, numeroOrden: 5000 + storeIndex * 100 + index, subtotal: quantity * price.valor,
        estado: 'Despachada', metodoPago: 'efectivo', createdAt: new Date(`${dateKey(day)}T${String(hour).padStart(2, '0')}:15:00-04:00`).toISOString(),
        items: [{ productoId: product._id, nombre: product.nombre, tipo: price.tipo, precio: price.valor, cantidad: quantity }] };
    });
    return { id: `demo-store-${storeIndex}`, nombre, zona, estadisticasAutorizadas: storeIndex !== 4, promocionesAutorizadas: storeIndex !== 2 && storeIndex !== 4, products, sales };
  });
}
export function campaignStatus(campaign: Campaign, today: string) {
  if (campaign.estado === 'borrador') return 'Borrador';
  if (today > campaign.hasta) return 'Finalizada';
  if (campaign.estado === 'pausada') return 'Pausada';
  return today < campaign.desde ? 'Programada' : 'Activa';
}
export function eligibleStores(stores: DemoStore[], campaign: Campaign) {
  return stores.filter(store => store.promocionesAutorizadas && (campaign.zona === 'todas' || store.zona === campaign.zona) && (campaign.categoriaAudiencia === 'todos' || store.products.some(product => productCategory(product) === campaign.categoriaAudiencia)));
}
export function validateCampaign(campaign: Campaign, stores: DemoStore[]): string | null {
  if (!campaign.titulo.trim() || !campaign.patrocinador.trim() || !campaign.descripcion.trim()) return 'Completa título, patrocinador y descripción.';
  if (!stores.some(store => store.products.some(product => product._id === campaign.productoId))) return 'Selecciona un producto.';
  if (!parseDate(campaign.desde) || !parseDate(campaign.hasta) || campaign.desde > campaign.hasta) return 'Selecciona una vigencia válida.';
  if (campaign.zona !== 'todas' && !stores.some(store => store.zona === campaign.zona)) return 'Selecciona una zona válida.';
  if (campaign.categoriaAudiencia !== 'todos' && !isProductCategory(campaign.categoriaAudiencia)) return 'Selecciona una categoría válida.';
  return null;
}
export function restoreCompaniesDemo(raw: string | null, stores: DemoStore[]): CompaniesDemoState | null {
  try {
    const state: CompaniesDemoState = JSON.parse(raw ?? 'null');
    if (!state || state.version !== 1 || !Array.isArray(state.campaigns) || !Array.isArray(state.interests)) return null;
    const ids = new Set<string>();
    for (const campaign of state.campaigns) {
      if (!campaign || typeof campaign.id !== 'string' || !campaign.id || ids.has(campaign.id) || !['borrador', 'activa', 'pausada'].includes(campaign.estado) || ['titulo', 'patrocinador', 'productoId', 'descripcion', 'zona', 'desde', 'hasta'].some(field => typeof campaign[field as keyof Campaign] !== 'string') || validateCampaign(campaign, stores)) return null;
      ids.add(campaign.id);
    }
    if (state.interests.some(id => typeof id !== 'string' || !ids.has(id))) return null;
    return { ...state, interests: [...new Set(state.interests)] };
  } catch { return null; }
}
