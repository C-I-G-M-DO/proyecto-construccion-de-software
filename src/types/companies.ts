import type { Producto } from './products';
import type { Venta } from './sales';
import type { ProductCategory } from '@/constants/product-categories';

export type DemoStore = { id: string; nombre: string; zona: string; estadisticasAutorizadas: boolean; promocionesAutorizadas: boolean; products: Producto[]; sales: Venta[] };
export type Campaign = {
  id: string; titulo: string; patrocinador: string; productoId: string; descripcion: string;
  zona: string; categoriaAudiencia: ProductCategory | 'todos'; desde: string; hasta: string;
  estado: 'borrador' | 'activa' | 'pausada';
};
export type CompaniesDemoState = { version: 1; campaigns: Campaign[]; interests: string[] };

/** Proposed server integration, not an existing endpoint. */
export type CompaniesScope = { rol: 'surtio_admin' | 'surtio_analista' | 'surtio_campanas'; negocioIdsAutorizados: string[] };
