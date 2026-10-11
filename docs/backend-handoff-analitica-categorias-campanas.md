# Integración: categorías, analítica y Surtío Empresas

Implementación frontend: 9 de octubre de 2026. No se cambió el backend ni se crearon llamadas a endpoints nuevos.

## Lo que funciona ahora

- Mobile: filtros del catálogo por categoría, combinados con búsqueda; categoría opcional al agregar/editar. Los artículos antiguos reciben una sugerencia por nombre. La elección manual prevalece y se conserva localmente, separada por cuenta. Todavía no se envía al servidor.
- Web real, Reportes: dos visualizaciones compartidas que consumen las respuestas existentes de `/api/sales` y `/api/products`. Ranking por valor vendido, unidades o libras; demanda por fecha, día de semana u hora. Una barra selecciona el producto de la segunda gráfica. No se incluyen productos sin ventas como ceros inventados.
- `/demo`: catálogo por categorías y las mismas gráficas con datos ficticios.
- `/demo-empresas`: panorama por zona/período, fichas de colmados con autorización simulada, campañas de prueba, borradores, activación, pausa, vigencia y vista previa patrocinada. Un clic «Me interesa» se conserva una sola vez por campaña en este navegador. No publica anuncios, contacta empresas ni registra métricas reales.
- Web: la suscripción al tema del sistema usa un snapshot coherente para evitar que, al alternar claro/oscuro, queden colores mezclados. Native conserva su hook existente.

La demo comercial es pública y no contiene datos privados. No equivale a un panel administrativo autenticado. El acceso real de Surtío deberá tener identidad propia, nunca las credenciales del colmadero.

## 1. Categoría sincronizada

Añadir un campo opcional `categoria` al producto, validado con estos identificadores:

```ts
type ProductCategory = 'bebidas' | 'viveres' | 'lacteos' | 'embutidos'
  | 'panaderia' | 'limpieza' | 'higiene' | 'otros';
```

Confirmar el contrato vigente de creación y edición; después aceptar el campo y devolverlo en el listado/detalle. Mantener compatibilidad con productos antiguos sin categoría y aplicar permisos por negocio. El frontend enviará el campo solo cuando el compañero confirme esta ampliación. Resolver entonces la migración de las elecciones locales y su precedencia frente a una categoría actualizada desde otro dispositivo.

Una categoría sirve para navegar; no identifica una marca ni un SKU. Para información de proveedores hacen falta un catálogo normalizado y correspondencias entre los productos que cada negocio registra.

## 2. Ventas y cobertura de las gráficas

Confirmar que cada venta devuelva identificador, fecha real y estado; cada línea, producto, nombre histórico, cantidad, precio y medida. Para paquetes conservar `equivalencia` histórica o `unidadesStockConsumidas`; no usar la equivalencia actual del producto para convertir una venta antigua.

Reportes abre con los últimos 30 días y ofrece Hoy, Últimos 7 días, Últimos 30 días y Este mes. Las gráficas se actualizan al cambiar fechas o filtros; «Generar reporte» consulta el resumen descargable. Si solo existen ventas anteriores, «Ver período de la última venta» abre los 30 días terminados en esa fecha. La interfaz distingue ventas fuera del período, ventas sin detalle, fechas inválidas y filtros sin coincidencias.

La respuesta actual esperada de `GET /api/sales` es un arreglo de ventas con `_id`, `createdAt` e `items`; cada item tiene `productoId`, `nombre`, `cantidad`, `precio` y `tipo`. Si aparece «no incluyen el detalle», comprobar que el servidor devuelve `items` completos para las ventas ya guardadas. El total/subtotal de una venta no permite reconstruir qué productos se vendieron. No se generan datos ficticios en Reportes de la aplicación habitual.

Los valores por producto ahora son `cantidad × precio`, **antes de descuentos**. El reporte de ingresos conserva su fuente existente. Para repartir descuentos/devoluciones entre productos se necesita una regla contable del servidor; no se deduce desde frontend.

La zona horaria del análisis es `America/Santo_Domingo`. Los extremos del período son inclusivos. Día de semana/hora muestran promedios sobre los días calendario seleccionados, con el total y denominador visibles. Son cálculos sobre registros disponibles, no afirmaciones de cobertura completa. Si `/api/sales` pagina o limita resultados, debe entregar metadatos de cobertura o agregados; no tratar la primera página como todo el mes.

Contrato de agregación propuesto (no es una ruta existente):

```ts
type AnalyticsQuery = {
  desde: string; hasta: string;
  productoId?: string; categoria?: ProductCategory; zonaId?: string;
  metrica: 'importeBruto' | 'unidades' | 'libras';
  agrupacion: 'dia' | 'diaSemana' | 'hora';
};
type Coverage = {
  negociosIncluidos: number; diasObservados: number;
  zonaHoraria: string; completa: boolean;
  inventarioHistoricoDisponible: boolean;
};
// ranking: productoId, nombre, categoría y valor comparable.
// serie: fecha/grupo, total, valor promedio y días del denominador.
// respuesta: ranking, serie, cobertura y líneas excluidas por datos insuficientes.
```

La demanda por hora ayuda a planificar reposiciones, pero no demuestra cuándo el stock estuvo bajo. Para esa futura gráfica registrar movimientos/snapshots por negocio, producto y fecha: stock antes/después, venta, reposición, ajuste/baja y umbral acordado. No reconstruir entradas históricas a partir del stock actual.

## 3. Acceso Surtío y autorización del colmadero

Crear roles propios y validarlos en el servidor: administrador de Surtío, analista y gestor de campañas. El colmadero conserva acceso únicamente a su negocio. Filtrar los datos antes de responder: no enviar todos los negocios para ocultarlos después en React.

Registrar autorizaciones independientes de estadísticas comerciales, promociones patrocinadas y compartir contacto cuando el colmadero solicita una cotización. Guardar finalidad, versión, negocio, quién autoriza, fecha y revocación. Excluir negocios no autorizados de consultas y exportaciones. Registrar auditoría de accesos/exportaciones; definir retención, revocación y mínimos de agregación antes de ofrecer datos a terceros.

El panel ficticio demuestra dos permisos independientes: estadísticas y promociones. No añade un checkbox de autorización real ni usa tokens de sesión del colmadero.

## 4. Campañas

Contrato de dominio propuesto:

```ts
type Campaign = {
  id: string; titulo: string; patrocinador: string;
  productoId: string; descripcion: string;
  zona: string; categoriaAudiencia: ProductCategory | 'todos';
  desde: string; hasta: string;
  estado: 'borrador' | 'activa' | 'pausada';
};
// Programada/finalizada se derivan de vigencia y estado.
```

Servidor: validar contenido y patrocinador, vigencia, público autorizado y permisos del gestor. Solo entregar campañas vigentes, activas y elegibles al negocio. Guardar eventos de impresión/interés con deduplicación y sin alterar ventas o existencias. Un aumento de ventas no demuestra por sí solo causalidad de una campaña. No compartir contactos por pulsar «Me interesa» sin el flujo y la autorización correspondientes.

Frontend listo: formulario, estados, segmentación, tarjeta «Patrocinado» y vista previa. Persistencia demo separada: `surtio.companies-demo.v1`; no hay llamadas comerciales ni estadísticas de impresiones inventadas. Acordar rutas de API, errores, paginación y roles antes de conectar la producción.

## Pruebas y archivos

```powershell
npx tsc --noEmit
node --test scripts/test-business-logic.cjs scripts/test-notifications.cjs scripts/test-demo.cjs scripts/test-analytics.cjs
npx expo start --web
```

Probar Reportes en la aplicación normal; probar `/demo` → Productos/Reportes y «Surtío Empresas · Demo» → Panorama/Colmados/Campañas. La guía de presentación está en `demo-presentacion.md`.

**Creados:** `src/constants/product-categories.ts`; `src/utils/product-categories.ts`; `src/services/product-categories.ts`; `src/components/product-category-controls.tsx`; `src/types/analytics.ts`; `src/utils/analytics.ts`; `src/hooks/use-sales-analysis.ts`; `src/components/analytics/sales-analytics.web.tsx`; `src/types/companies.ts`; `src/utils/companies-demo.ts`; `src/hooks/use-companies-demo.ts`; `src/components/companies/campaign-form.web.tsx`; `src/components/companies/companies-demo-screen.web.tsx`; `src/app/demo-empresas.tsx`; `src/app/demo-empresas.web.tsx`; `scripts/test-analytics.cjs`; este documento.

**Modificados:** `src/app/_layout.tsx`; `src/app/products.tsx`; `src/app/add_product.tsx`; `src/app/edit_products.tsx`; `src/context/product_context.tsx`; `src/services/lists.ts`; `src/types/products.ts`; `src/types/sales.ts`; `src/components/reports-screen.web.tsx`; `src/hooks/use-color-scheme.web.ts`; los componentes de catálogo/formulario/modal de demo y las guías de presentación/modelo de negocio.

**Eliminados:** ninguno. No se hizo commit, push ni publicación.
