export type UnidadStock = 'unidad' | 'libra';
export type TipoMedida = 'unidad' | 'paquete' | 'docena' | 'libra' | 'media_libra' | 'cuarta' | 'onza';

export const MEDIDAS: { tipo: TipoMedida; nombre: string; unidadStock: UnidadStock; factor?: number }[] = [
  { tipo: 'unidad', nombre: 'Unidad', unidadStock: 'unidad', factor: 1 },
  { tipo: 'paquete', nombre: 'Paquete', unidadStock: 'unidad' },
  { tipo: 'docena', nombre: 'Docena (12 unidades)', unidadStock: 'unidad', factor: 12 },
  { tipo: 'libra', nombre: 'Libra (lb)', unidadStock: 'libra', factor: 1 },
  { tipo: 'media_libra', nombre: 'Media libra (½ lb)', unidadStock: 'libra', factor: 0.5 },
  { tipo: 'cuarta', nombre: 'Cuarta (¼ lb)', unidadStock: 'libra', factor: 0.25 },
  { tipo: 'onza', nombre: 'Onza (¹⁄₁₆ lb)', unidadStock: 'libra', factor: 1 / 16 },
];

export const nombreMedida = (tipo: string) => MEDIDAS.find(m => m.tipo === tipo)?.nombre ?? tipo;

/** Existing products have no unidadStock: keep their previous stock behavior. */
export function consumoEnStock(tipo: TipoMedida, equivalencia?: number, unidadStock?: UnidadStock): number {
  if (!unidadStock) return tipo === 'paquete' ? (Number(equivalencia) || 1) : 1;
  const medida = MEDIDAS.find(m => m.tipo === tipo);
  if (!medida || medida.unidadStock !== unidadStock) return Number.NaN;
  return tipo === 'paquete' ? Number(equivalencia) : (medida.factor ?? Number.NaN);
}
