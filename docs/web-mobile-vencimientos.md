# Surtío: administración Web y operaciones Mobile

## Comportamiento implementado

- **Web:** Inicio, Historial, Alertas, Reportes y Perfil. Los enlaces antiguos a productos, carrito, despacho y agregar/editar productos redirigen a Inicio. No hay cuaderno de fiao, funciones pendientes ni indicadores de desarrollo en el dashboard.
- **Inicio:** ventas del día, productos registrados y ticket promedio en Web; operaciones en Mobile. Se retiró Actividad reciente de ambas plataformas. Los registros se consultan únicamente en Historial. El nombre se obtiene de la sesión guardada; mantiene el respaldo «José» autorizado anteriormente.
- **Historial:** filtro combinado de número de orden, período, nombre de producto y montos mínimo/máximo. Hoy es el día local; esta semana empieza el lunes; este mes empieza el día 1. Los montos son inclusivos. La búsqueda ignora mayúsculas y acentos. Restablecer vuelve a todo el historial. Se aplica sobre lo que devuelve actualmente `GET /api/sales`, sin simular filtros de servidor.
- **Reportes Web:** calendario para ambas fechas, validación del rango, consulta de los endpoints existentes, Excel y PDF mediante el diálogo de impresión del navegador. Elegir «Guardar como PDF» para generar el archivo. Los datos de pagos, puntos y productos siguen presentes en la descarga; el desglose de pagos/puntos se puede expandir. Los reportes diarios se presentan inicialmente contraídos.
- **Mobile:** Inicio, Historial, Despacho, Alertas y Perfil. Productos, carrito y formularios continúan accesibles desde las operaciones actuales. Reportes se reserva para Web.
- **Vencimiento opcional:** «Este producto vence» abre un calendario. La fecha aplica a toda la cantidad inicial registrada en unidades o libras. El formulario admite también fechas anteriores; se reflejarán como vencidas cuando el servidor las devuelva.
- **Alertas:** se calculan exclusivamente con fechas y cantidades de lotes que devuelve el servidor. Vencido: antes de hoy; por vencer: de hoy a siete días inclusive; sin alertas: después de siete días. Se excluyen lotes agotados y datos inválidos. Los productos con existencias y sin fechas se señalan aparte, sin declararlos seguros.
- **Identidad:** icono y favicon suministrados. La foto aparece antes de JavaScript en Web y está configurada como splash nativa proporcional en una compilación propia de iOS. Después del bundle se conserva la pantalla React con foto, fondo desenfocado, indicador y transición. Android conserva el icono en la pantalla del sistema. Expo Go mantiene su propio cargador; los cambios nativos requieren reconstruir Surtío. Se conserva la apariencia automática clara/oscura.
- **Notificaciones:** activación voluntaria desde Alertas en ambas plataformas, avisos locales y suscripciones push preparadas para el servidor. Ver [contrato y pruebas](notificaciones-vencimientos.md). No se modifica el backend ni se afirma que haya envío remoto sin esa integración.

## Integraciones de backend

No se editó el backend. Las rutas siguientes ya las consumía el frontend antes de este cambio:

| Consulta | Respuesta admitida |
| --- | --- |
| `GET /api/sales` | Array de ventas |
| `GET /api/products` | Array de productos |
| `POST /api/products` | Producto creado, directo o dentro de `producto` |
| `GET /api/reports?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` | Reporte directo o `{ "reporte": ... }` |
| `GET /api/reports/daily` | Array de reportes o `{ "reportes": [...] }` |

Se usa el Bearer token y `EXPO_PUBLIC_API_URL` existentes. Reportes mantiene el manejo de sesión vencida. Los errores se muestran como errores, sin reemplazarlos por resultados ficticios. Un valor de reporte ausente se presenta como «—» o «No disponible» en la exportación; cero sigue siendo cero.

### Contrato propuesto para vencimientos (pendiente de guardar en backend)

El frontend **ya prepara y envía** el campo opcional `lotesIniciales` a la ruta de creación existente si se activa el interruptor:

```json
{
  "nombre": "Salami",
  "precios": [{ "tipo": "libra", "valor": 150 }],
  "stock": 5,
  "unidadStock": "libra",
  "imagen": "",
  "lotesIniciales": [{ "cantidad": 5, "fechaVencimiento": "2026-10-10" }]
}
```

Sin vencimiento, se omite `lotesIniciales`. El compañero debe:

1. Validar fecha de calendario estricta `YYYY-MM-DD` y cantidad positiva en la unidad base del producto. En esta pantalla hay un solo lote y su cantidad debe coincidir con el stock inicial; no sumar la cantidad una segunda vez al stock.
2. Guardar los lotes asociados al producto y devolverlos en la creación y en `GET /api/products` con esta estructura opcional:

```json
{
  "_id": "id-producto",
  "nombre": "Salami",
  "stock": 5,
  "unidadStock": "libra",
  "lotes": [{ "_id": "id-lote", "cantidadDisponible": 5, "fechaVencimiento": "2026-10-10" }]
}
```

3. Mantener `cantidadDisponible` actualizada cuando haya consumo, despacho, eliminación o reposición. Acordar el consumo de lotes y sus fechas con el equipo; el frontend no inventa esa política. El stock global y el stock por lotes deben seguir coherentes; admitir productos existentes sin fechas.
4. Mantener las consultas limitadas al negocio autorizado. No confiar en un identificador de negocio enviado por el cliente.

Si la API acepta el producto pero no devuelve el lote con fecha y cantidad, la app avisa **«El producto se guardó, pero no se confirmó su fecha de vencimiento»**. No crea una alerta local ni afirma que la fecha se guardó. Si la API rechaza el campo nuevo, se muestra su error y se conserva el formulario para corregirlo/reintentar. Hace falta implementar este contrato para persistir vencimientos: no se cambió ningún modelo ni controlador desde el frontend.

Los estados/tipos visuales están en `types/expiry.ts`, los lotes y payload en `types/products.ts`, y las reglas de presentación en `utils/expiry.ts`. Hoy no se llama a un endpoint de alertas nuevo; se reutiliza la colección de productos.

### Contrato propuesto para filtrar historial en servidor

`types/sales.ts` define `HistoryQuery`; `utils/history.ts` construye los campos `desde`, `hasta`, `orden`, `producto`, `montoMin` y `montoMax`. **Aún no se envían a la API.** Al implementar filtros en servidor, aceptar estos parámetros en la ruta acordada, mantener los límites inclusivos, buscar dentro de los ítems y ordenar por `createdAt` descendente. Acordar la zona horaria del negocio para que los cortes de fechas coincidan con el frontend. Añadir paginación cuando sea necesaria y asegurar que la consulta de actividad reciente siempre incluya la última orden.

El feed actual es de **ventas registradas** desde `/api/sales`; no se incorporan órdenes pendientes ni se supone que sus estados existen. Si llega `estado`, se muestra; si no llega, se omite. El total usa `total` cuando existe y `subtotal` para las ventas anteriores. Los campos del reporte consumido están en `types/reports.ts`.

## Cómo probar

Desde la carpeta del proyecto:

```powershell
npx tsc --noEmit
node scripts/test-business-logic.cjs
npx expo start -c
```

### Web

1. Abrir con `w` e iniciar sesión. Comprobar Inicio, Historial, Alertas, Reportes y Perfil; reducir la ventana y activar modo oscuro del sistema.
2. Verificar que Inicio muestra el resumen y no Actividad reciente. Entrar en Historial para consultar las ventas, con la última primero, y expandir una para ver productos/precios.
3. Combinar Hoy / Esta semana / Este mes con un nombre de producto y rango de monto. Probar límites exactos, un mínimo mayor al máximo y Restablecer. Sin coincidencias debe mostrarse un estado vacío.
4. En Reportes seleccionar días en ambos calendarios, generar el reporte, descargar Excel y usar Imprimir / guardar PDF. Cambiar las fechas debe quitar el resultado anterior hasta generar de nuevo. Expandir pagos/puntos y un reporte diario.
5. Desconectar el backend y actualizar: debe aparecer un error con reintento. No deben mostrarse datos inventados.
6. Abrir `/products`, `/cart`, `/dispatch`, `/add_product` o `/edit_products` en Web: debe llevar a Inicio. Alertas ahora tiene su propia pantalla Web.
7. Abrir la raíz `/` para comprobar la imagen de arranque y la transición a Inicio o Login según la sesión guardada. La imagen debe conservar su proporción al cambiar el tamaño de la ventana.

### Mobile / iPhone

1. Revisar la barra de cinco tabs: no debe incluir Reportes y sí Alertas. Inicio mantiene registro de ventas, nuevo producto y despacho; probar que los formularios y listas se desplazan sin invadir las zonas seguras.
2. Nuevo producto sin vencimiento: guardar como antes. Con vencimiento: seleccionar una fecha y cantidad; probar cero stock y fecha sin seleccionar. Para unidades se mantiene la validación de enteros.
3. Tras conectar el contrato de backend, crear lotes con fecha de ayer, hoy, mañana, dentro de siete días y después de ocho días. Comprobar etiquetas, cantidad y filtros en Alertas. Agotar un lote y actualizar: debe desaparecer.
4. Con productos anteriores sin fechas: mostrar falta de vencimientos registrados. Con fechas válidas lejanas: mostrar Sin alertas. Verificar también el estado de error y el reintento.
5. Reiniciar la app para ver la foto y transición después del bundle. La pantalla «Building JavaScript bundle» de Expo Go sigue perteneciendo a Expo Go. La foto en la splash nativa de iOS requiere reconstruir Surtío; Android conserva el icono en la pantalla del sistema. Referencia: https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/.

Las pruebas de navegador automatizadas usan respuestas aisladas de ejemplo; no crean ventas ni cambian datos del backend real. La exportación de JavaScript para iOS y Android verifica módulos y assets, pero no reemplaza una compilación nativa ni la comprobación visual en un iPhone físico.

### Verificación realizada

- TypeScript (`npx tsc --noEmit`): sin errores.
- Pruebas de negocio y notificaciones (`node --test scripts/test-business-logic.cjs scripts/test-notifications.cjs`): 23 aprobadas.
- Exportación de JavaScript de Web, iOS y Android (`npx expo export --platform all --no-bytecode`): completada. La opción `--no-bytecode` se usó para verificar módulos y assets porque este entorno restringe ejecutar el compilador nativo de Hermes.
- Navegador limpio con datos aislados: navegación, historial, filtros combinados, elección de fechas, descarga Excel, contenido del PDF separado de la página, errores/reintentos, modo oscuro y redirecciones de rutas Web. La comprobación adicional de Alertas/notificaciones se documenta en su guía.
- Dashboard, historial y reportes sin desbordamiento horizontal a 1440, 768 y 430 px; nueva splash con imagen completa y fondo ajustado a 1440 × 1000 y 428 × 926 px.
- Inicio con sesión, sin sesión y error de almacenamiento/reintento: aprobado. Cero errores de página registrados en la comprobación final.

### Error `M_ID` de Chrome

La traza suministrada apunta a `chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js`. No hay referencias a `M_ID` ni a ese identificador en el código de Surtío. La comprobación con un perfil de navegador limpio pasa sin ese error.

Para comprobarlo en tu equipo, abre `chrome://extensions`, activa «Modo de desarrollador» para ver los identificadores y localiza `eppiocemhmnlbhjplcgkofciiegomcon`. Desactiva temporalmente esa extensión y recarga la app. También puedes usar un perfil nuevo sin extensiones. Una ventana de incógnito solo sirve si la extensión no tiene permiso de ejecución allí.

Se corrigieron además diferencias entre el HTML inicial y el navegador al cargar iconos, fecha y tamaños del layout Web. La comprobación de navegador no registra errores de página.

## Archivos modificados

- `.gitignore`: excluye las salidas generadas de revisión `dist-review/` y `dist-debug/`; estas carpetas temporales no forman parte del código a subir.
- `app.json`: icono, favicon y splash.
- `src/app/_layout.tsx`, `src/app/index.tsx`: transición e inicio con la identidad suministrada.
- `src/app/login.tsx`, `src/app/login.web.tsx`: logo compartido y descripción administrativa de Web.
- `src/app/(tabs)/_layout.web.tsx`, `src/app/(tabs)/home.web.tsx`: layout y dashboard administrativo.
- `src/app/(tabs)/history.tsx`: historial/filtros con componentes compartidos.
- `src/app/(tabs)/reports.tsx`: respaldo de ruta Mobile; reportes se implementan en su variante Web.
- `src/app/add_product.tsx`, `src/types/products.ts`: formulario y contrato de vencimientos por lote.
- `src/components/app-tabs.tsx`, `src/components/mobile-dashboard.tsx`: navegación operativa y fecha compartida.
- `docs/backend-handoff-despacho-medidas-reportes.md`: referencia al contrato de reportes actual para evitar instrucciones antiguas contradictorias.

## Archivos creados

- Assets: `assets/images/surtio-icon.png`, `assets/images/surtio-splash.png`.
- Rutas por plataforma: `src/app/(tabs)/reports.web.tsx`, `src/app/(tabs)/dispatch.web.tsx`, `src/app/(tabs)/alerts.tsx`, `src/app/(tabs)/alerts.web.tsx`, `src/app/products.web.tsx`, `src/app/cart.web.tsx`, `src/app/add_product.web.tsx`, `src/app/edit_products.web.tsx`.
- Componentes: `src/components/web-dashboard.web.tsx`, `src/components/reports-screen.web.tsx`, `src/components/business-ui.tsx`, `src/components/sale-card.tsx`, `src/components/expiry-card.tsx`, `src/components/startup-splash.tsx`, `src/components/ui/date-picker.tsx`, `src/components/ui/business-icon.tsx`.
- Hooks: `src/hooks/use-focused-list.ts`, `src/hooks/use-current-day.ts`, `src/hooks/use-reports.ts`, `src/hooks/use-responsive-dimensions.ts`.
- Servicios: `src/services/reports.ts`, `src/services/report-exports.web.ts`.
- Estilos: `src/styles/admin.styles.ts`, `src/styles/business.styles.ts`, `src/styles/startup.styles.ts`.
- Tipos: `src/types/sales.ts`, `src/types/reports.ts`, `src/types/expiry.ts`.
- Utilidades: `src/utils/dates.ts`, `src/utils/history.ts`, `src/utils/expiry.ts`, `src/utils/report-content.ts`.
- Validación: `scripts/test-business-logic.cjs`.
- Documentación: este archivo, `docs/web-mobile-vencimientos.md`.

No se eliminaron archivos del proyecto. Se añadió `expo-notifications` compatible con SDK 57. El código anterior de reportes se reemplazó por módulos con responsabilidades separadas; se conservan las consultas y los datos utilizados para descargar reportes. El inventario adicional está en `docs/notificaciones-vencimientos.md`.
