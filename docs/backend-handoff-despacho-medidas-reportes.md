# Contrato de backend para medidas y despacho

Este documento describe las rutas **nuevas propuestas** que ya consume el frontend. No existen todavía en `backend-surtio`; el backend actual solo tiene `GET/POST /api/products` y `GET/POST /api/sales`. La venta directa con `POST /api/sales` debe seguir funcionando.

## 1. Medidas e inventario

- Añadir `unidadStock: "unidad" | "libra"` al producto. Es obligatoria para productos nuevos. Para productos antiguos sin este campo, revisar la unidad real antes de migrarlos, especialmente si tienen precios mixtos.
- Ampliar `Product.precios[].tipo` y `Sale.items[].tipo` con `unidad`, `paquete`, `docena`, `libra`, `media_libra`, `cuarta`, `onza`. Mantener los tres valores existentes.
- Aceptar y devolver `unidadStock` en `POST /api/products` y `GET /api/products`.
- Cada precio tiene una presentación. `paquete` requiere `equivalencia` positiva en unidades; `docena` consume 12 unidades. En un producto con stock en libras, `libra` consume 1 lb, `media_libra` 0.5 lb, `cuarta` 0.25 lb y `onza` 0.0625 lb. Aquí **cuarta significa ¼ de libra**; confirmar con el equipo si su colmado usa otro significado.
- No mezclar presentaciones de unidades con stock en libras, ni al revés. El stock en unidades y la equivalencia de paquetes deben ser enteros; el stock en libras puede ser decimal. Validar precio, cantidad y equivalencia en el servidor. Calcular los importes y el descuento de stock con los datos guardados en el producto, sin confiar en precios o subtotal del cliente.
- El frontend ya llama `PATCH /api/products/:id/stock` para reponer inventario y `PATCH /api/products/:id/precios` para editar precios, pero estas rutas **no aparecen en la copia del backend revisada**. Si se necesita que esas pantallas funcionen, implementar o sincronizar dichas rutas.

## 2. Órdenes para despacho

Decisión de producto: enviar una orden **no crea una venta ni descuenta inventario**. La venta se crea y el stock se descuenta una sola vez cuando se confirma el despacho.

### `POST /api/orders`

Con Bearer token, recibe:

```json
{ "clientRequestId": "<id generado por dispositivo>", "items": [{ "productoId": "<id>", "tipo": "cuarta", "cantidad": 2 }] }
```

El servidor valida pertenencia de productos y presentaciones, consulta sus precios, calcula `subtotal`, guarda una copia de nombre/precio/equivalencia por ítem, crea una orden con `estado: "pendiente"` y responde `201` con la orden completa. No debe confiar en importes enviados por el dispositivo. Guardar `clientRequestId` con una restricción única por negocio/usuario: si se repite, devolver la misma orden sin crear otra. Esto permite reintentar tras un corte de red sin duplicarla.

### `GET /api/orders?estado=pendiente`

Con Bearer token, responde un **array** de órdenes pendientes del mismo negocio, ordenadas de la más reciente a la más antigua. Cada orden debe tener:

```json
{
  "_id": "<id>",
  "numeroOrden": 1001,
  "estado": "pendiente",
  "createdAt": "2026-10-02T12:00:00.000Z",
  "createdByName": "Miembro que creó la orden",
  "subtotal": 25,
  "items": [{ "productoId": "<id>", "nombre": "Arroz", "tipo": "cuarta", "cantidad": 2, "precio": 12.5, "total": 25, "equivalencia": null }]
}
```

### `POST /api/orders/:id/dispatch`

Con Bearer token, verifica que la orden pertenece al negocio, sigue pendiente y hay stock. En una operación atómica, crea una `Sale` vinculada a la orden, descuenta el inventario y cambia el estado a `despachada`; devuelve la orden actualizada. Repetir la petición no puede crear otra venta ni descontar stock otra vez. Si falla por falta de stock, responde `409` con un `message` legible. Una cancelación futura deberá dejar el stock intacto.

El backend actual filtra datos por `userId`; `User` no tiene roles ni identificador de negocio compartido. Si diferentes empleados iniciarán sesión con cuentas propias, hace falta vincularlos al mismo negocio y autorizar quién puede crear/despachar órdenes. Devolver `createdByName` desde la cuenta autenticada cuando exista. Compartir una sola cuenta no resuelve los permisos por empleado; el historial y los reportes también deben consultar todas las ventas del mismo negocio.

## 3. Reportes

La implementación actual de Reportes Web conserva las consultas que ya tenía el frontend: `GET /api/reports?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` y `GET /api/reports/daily`. Los reportes se descargan en Excel o se imprimen/guardan como PDF desde el navegador. El dashboard y el historial siguen usando `GET /api/sales`. Consultar [el contrato y las pruebas actuales](web-mobile-vencimientos.md) para los tipos de respuesta, filtros de historial y vencimientos por lote. Este apartado reemplaza la descripción anterior de reportes calculados exclusivamente en el cliente; el backend no se modificó en esta adaptación.

## Comprobaciones de integración

1. Crear producto con stock en libras y precios por libra, cuarta y onza. Consultarlo de vuelta y confirmar que conserva `unidadStock` y todas las medidas.
2. Enviar una orden de dos cuartas: debe quedar pendiente, sin crear venta ni reducir stock.
3. Despacharla: debe crear una venta y reducir exactamente 0.5 lb. Repetir la petición: no debe alterar la venta ni el stock.
4. Revisar que la venta aparezca en historial y reportes, y que productos anteriores por unidad/paquete mantengan su comportamiento.
