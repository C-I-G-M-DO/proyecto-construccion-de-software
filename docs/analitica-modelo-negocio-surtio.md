# Propuesta de analítica y modelo comercial de Surtío

Fecha: 8 de octubre de 2026. Presentación: miércoles 14 de octubre.

Actualización del 9 de octubre: se implementó la opción A de dos gráficas conectadas en Reportes Web y en la demo. El panel «Surtío Empresas» funciona como demostración con datos ficticios en `/demo-empresas`: panorama, colmados y campañas de prueba. La autenticación administrativa, autorizaciones reales, agregados de todos los negocios y publicación de campañas requieren backend. No se añadieron endpoints reales. Ver el [contrato para el compañero](backend-handoff-analitica-categorias-campanas.md).

## 1. Opciones para reportes del colmadero

Los tres diseños comparten un período, producto seleccionado y métrica. Elegir un producto actualiza las visualizaciones disponibles; no hace falta crear una pantalla por cada pregunta.

| Opción | Visualizaciones | Ventaja | Límite |
| --- | --- | --- | --- |
| A. Dos gráficas conectadas — recomendada para la beta | Ranking de productos + patrón de ventas | Responde qué vender y cuándo reponer, sin saturar | El stock histórico necesita datos adicionales |
| B. Tres gráficas | Ranking + patrón de ventas + evolución del inventario | Añade seguimiento real de mínimos y reposiciones | Requiere registrar movimientos o snapshots de inventario |
| C. Un explorador | Un panel que cambia entre Productos, Demanda e Inventario | Ocupa poco espacio y escala a más métricas | Se comparan menos cosas al mismo tiempo; inventario mantiene el mismo requisito de datos |

### Gráfica de productos

Barras horizontales con los 5 o 10 productos más o menos vendidos. Selector de ingresos en RD$ o cantidad en unidad base. Filtro de período y, cuando exista el dato, categoría. Al pulsar una barra, el patrón de ventas muestra ese producto.

Para incluir un producto con cero ventas debe existir el catálogo completo y cobertura completa del período. Si solo recibimos los productos vendidos, la etiqueta será «Menos vendidos entre los que registraron ventas». Un producto sin registro no equivale automáticamente a cero.

Las libras y las unidades no se suman como una sola medida. Para ordenar productos de distintas unidades, usar ingresos; para volumen, separar unidades base. Los ingresos no son ganancias: hacen falta costos para calcular margen.

### Gráfica de demanda

Un mismo componente cambia entre evolución diaria y patrón por día de la semana u hora. Se puede empezar con una línea diaria; las vistas semanales u horarias son modos del mismo componente. Tooltip con fecha, cantidad o ingresos y número de ventas; al seleccionar un punto puede abrirse el historial filtrado.

Para patrones recurrentes conviene mostrar promedio por día observado, además del total. Cuatro lunes no deben compararse directamente con tres martes sin aclararlo. Si no hay cobertura suficiente, mostrar «Datos insuficientes». Ventas despachadas y sus fechas permiten estos análisis; cancelaciones y devoluciones deben tratarse de forma consistente.

### Inventario

Hasta disponer de historia, mostrar una tabla breve con existencias actuales y productos que requieren revisión. Un umbral manual o una cobertura estimada pueden agregarse si se aprueba su criterio, siempre identificando una estimación.

Para afirmar «este producto tuvo stock bajo los jueves», el servidor debe registrar existencias antes/después, reposiciones, ventas, ajustes y bajas, o snapshots periódicos. Las existencias actuales y las ventas por sí solas no reconstruyen las entradas ni los ajustes anteriores. La tercera gráfica empezaría a acumular historia desde la integración, sin inventar datos pasados.

### Estructura compartida propuesta

- Un filtro común: desde, hasta, producto, categoría opcional, métrica y granularidad.
- Una definición común de zona horaria del negocio: `America/Santo_Domingo` para el mercado dominicano.
- Un componente de ranking y otro de series temporales, con sus adaptadores de datos separados de la interfaz.
- Estados: cargando, vacío confirmado, cobertura incompleta, error recuperable y resultado.
- Un resumen del período con ventas, ingresos y ticket promedio.
- Actualización al cambiar filtros, cancelando solicitudes anteriores para evitar resultados desfasados.

El frontend actual consume ventas con fecha, líneas, precio y producto, y reportes con agregados. El compañero debe confirmar qué devuelve la versión vigente del servidor. La copia local del backend disponible para revisar puede ser anterior a las funcionalidades actuales.

## 2. Opciones para el negocio de Surtío

Confirmado por el usuario: autorización del colmadero para el uso de datos y acceso propio para administradores de Surtío. La beta no cobrará suscripción al colmadero.

### A. Panel interno y campañas — recomendado

Panel separado «Surtío Empresas» para el equipo de Surtío, con tres espacios:

1. **Panorama comercial:** zona, período, categoría, marca y producto; demanda agregada, horarios, negocios participantes y cobertura del dato.
2. **Colmados:** segmentos y fichas individuales para personal autorizado, con actividad comercial, disponibilidad de datos y estado de autorización. Un administrador del colmado ve únicamente su negocio en la aplicación normal.
3. **Campañas:** crear y revisar una promoción, elegir público, programar, pausar y consultar resultados. Estados: borrador, programada, activa, pausada y finalizada.

Primer producto vendible: un informe periódico para un distribuidor o un estudio puntual sobre demanda de una categoría, dentro de la muestra autorizada de Surtío. Segundo producto: una campaña patrocinada de duración y audiencia definidas. La fijación de precio necesita validar demanda comercial; no se promete una tarifa ni resultados todavía.

Inicialmente, el proveedor recibe reportes agregados; no necesita acceso directo a fichas individuales. Esto reduce complejidad antes de construir un portal para terceros.

### B. Añadir solicitudes comerciales

Además de lo anterior, una tarjeta permite al colmadero pulsar «Me interesa» o «Solicitar cotización». Antes de compartir su contacto con un proveedor se presenta quién lo recibirá y para qué. Esta señal puede convertirse en una oportunidad comercial autorizada y medible.

Permite medir interés concreto. Necesita un flujo real de seguimiento y políticas claras sobre contacto; un clic no representa una compra.

### C. Portal para proveedores

Más adelante, cada proveedor tendría su propio acceso a segmentos e informes contratados y a sus campañas. Es el camino más escalable, pero exige permisos, límites de exportación, facturación y control de acceso más completos. No lo proponemos como requisito para el miércoles.

## 3. Información que sí se puede convertir en valor

| Pregunta del proveedor | Datos mínimos | Resultado útil |
| --- | --- | --- |
| ¿Dónde y a qué hora se vende mi producto? | Producto normalizado, ventas, zona y fecha/hora | Demanda agregada por zona y franja horaria |
| ¿Qué negocios venden más o menos? | Ventas por negocio y cobertura comparable | Segmentos de rotación, sin confundir ausencia de datos con baja demanda |
| ¿Cuándo conviene abastecer? | Inventario histórico, umbral y movimientos | Frecuencia de mínimos y ventanas de reposición |
| ¿Qué promociones interesan? | Campaña, exposición e interacción | Alcance, clics y solicitudes de información |

Importante: las ventas del colmado miden salida al consumidor, no sus compras al distribuidor. Para analizar abastecimiento o consumo del proveedor hacen falta entradas, órdenes de compra u otros registros confirmados.

El informe debe decir «entre los colmados participantes de Surtío» y mostrar cantidad de negocios, período y cobertura. No es una estimación del mercado nacional completo sin un estudio adicional.

Los nombres libres de productos no bastan para comparar marcas. Se necesita un catálogo común con SKU o GTIN cuando exista, marca, presentación, categoría y distribuidor, más un proceso de correspondencia para productos ya registrados. «Salami» solo no identifica Induveca ni ninguna otra marca.

## 4. Promociones dentro de la app

Una sección pequeña «Productos para tu negocio» puede mostrar una o dos recomendaciones relevantes por zona y tipo de colmado. Cada tarjeta debe indicar **Patrocinado**, nombre, presentación, distribuidor y condiciones conocidas. Acciones sugeridas: «Ver producto» y «Me interesa».

Ejemplo: un distribuidor promociona un salami alternativo en negocios que venden esa categoría. La tarjeta muestra una alternativa, sin afirmar calidad superior sin evidencia y sin sustituir automáticamente productos, inventario o precios del colmadero.

Surtío controla revisión y programación de campañas. No se muestran promociones caducadas o pausadas. Un colmadero puede ocultar una recomendación.

Métricas iniciales: negocios elegibles, negocios alcanzados, impresiones con criterio de deduplicación, clics y solicitudes autorizadas. Medir ventas atribuibles requiere vinculación real con compras; un aumento de ventas por sí solo no demuestra que la campaña lo causó.

## 5. Accesos y autorización de datos

Separar permisos de administrador de Surtío y del colmado, validados **en el servidor**. Ocultar una tab no protege información. No se comparten ni se usan las contraseñas de los colmaderos para entrar al panel de Surtío.

Registrar la autorización por finalidad, con versión del texto, fecha, negocio y usuario que la concedió. Propuesta de finalidades independientes:

- Estadísticas agregadas para empresas.
- Recomendaciones y campañas patrocinadas.
- Compartir contacto con un proveedor cuando se solicita una cotización.

Definir revocación, retención y trazabilidad de exportaciones. Una revocación debe excluir el negocio de consultas y exportaciones futuras conforme a la política acordada. No basta un checkbox guardado solo en frontend.

Como criterio inicial de producto, los informes de proveedores pueden ocultar segmentos con menos de 10 negocios y limitar cruces de filtros que identifiquen un negocio. Ese número es una propuesta a validar, **no una exigencia legal ni garantía de anonimato**.

Cuando se tratan o transfieren datos personales, la Ley dominicana 172-13 contempla información sobre finalidad y destinatarios y consentimiento, con excepciones y exclusiones. Su alcance sobre cada conjunto de datos debe confirmarse antes de comercializar información identificable. [Texto oficial publicado por el Poder Judicial](https://transparencia.poderjudicial.gob.do/documentos/PDF/leyes_transparencia/LT_ley_ley_172_13_(1).pdf).

## 6. Trabajo frontend implementado y backend pendiente

**Frontend actual:** ranking y demanda compartidos, filtros por categoría en el catálogo Mobile, categorías locales al agregar/editar, panel de empresas de demostración, campañas con segmentación/vigencia/vista previa y un interés ficticio por navegador. Los datos existentes alimentan las gráficas reales; el panel comercial usa exclusivamente ejemplos. No se implementó una autorización real con un checkbox local.

**Backend:** roles separados y control por negocio; registro de autorizaciones y revocaciones; catálogo normalizado y zonas; agregados con cobertura; movimientos de stock; gestión de campañas; registro validado de eventos y solicitudes; permisos y auditoría para exportaciones.

Contratos conceptuales que debemos acordar con el compañero, no rutas existentes:

```ts
type AnalyticsQuery = {
  desde: string; hasta: string;
  productoId?: string; categoriaId?: string; zonaId?: string;
  metrica: 'ingresos' | 'cantidadBase';
  granularidad: 'dia' | 'diaSemana' | 'hora';
};
type Coverage = {
  negociosIncluidos: number;
  diasConCobertura: number;
  zonaHoraria: string;
  inventarioHistoricoDisponible: boolean;
};
// Ranking: productoId, nombre, unidadBase, valor.
// Serie: fecha o agrupación, valor, ventas y días observados.
// Inventario: productoId, fecha, stockBase y umbral conocido.
// Campaña: patrocinador, producto, audiencia, vigencia, estado y contenido revisado.
// Autorización: negocioId, finalidad, versión, aceptadaEn y revocadaEn.
```

No enviar listas completas de todos los negocios al navegador para ocultarlas después. Los filtros y permisos deben aplicarse antes de devolver información.

## 7. Presentación del miércoles 14

Demo elegida: datos ficticios, enlace en navegador, sin Expo Go ni backend. Ver [guía de publicación y ensayo](demo-presentacion.md).

Guion sugerido de 4 minutos:

1. **Problema — 40 s:** ventas e inventario fragmentados dificultan saber qué falta, qué vence y qué tiene demanda.
2. **Solución — 70 s:** mostrar producto, orden, despacho, historial y alerta en la demo. La venta se registra al despachar.
3. **Modelo — 60 s:** beta sin suscripción; futuras estadísticas agregadas autorizadas para distribuidores y campañas patrocinadas útiles para el colmadero. Distinguir funciones actuales de propuestas.
4. **Valor — 30 s:** el colmadero organiza su operación; el proveedor entiende mejor la demanda dentro de la muestra participante.
5. **Prueba — 40 s:** mostrar enlace/QR y proponer una tarea concreta: vender dos panes y revisar el historial.

Frase del modelo: **«Surtío ayuda al colmadero a operar mejor y convierte patrones comerciales autorizados en información útil para distribuidores, con promociones relevantes dentro de la app».**

Plan de trabajo: 9 octubre implementación y verificación; 10–11 publicación de demo y pruebas; 12 prueba en teléfonos; 13 ensayo completo y copia local; 14 presentación. Las dos gráficas y el panel comercial ficticio ya se pueden demostrar. El servidor comercial y el historial de inventario quedan definidos en el contrato de integración.
