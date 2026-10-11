# Demo pública de Surtío para la presentación

## Qué está listo

La ruta `/demo` abre una experiencia independiente con **datos ficticios**. No requiere login ni llama APIs de Surtío. No monta los providers reales de sesión, productos o notificaciones. No modifica tokens ni solicita permisos de notificación.

Permite consultar y agregar productos, editar nombre y precio, preparar una orden, ver sus detalles en una modal y confirmar o cancelar el despacho. Confirmar registra una venta ficticia y actualiza existencias, historial y reportes. Los lotes vencidos no se pueden vender; la demo consume primero los lotes vigentes que vencen antes. Esta regla FEFO pertenece a la demo y no cambia el backend real.

El formulario nuevo permite las medidas existentes, existencias en libras o unidades y vencimiento opcional para toda la cantidad inicial. Historial tiene filtros; Alertas muestra vencidos, próximos y vigentes; Reportes permite período por calendario y descargas Excel/PDF, identificadas como ficticias.

Cada navegador guarda su propia copia con `localStorage['surtio.demo.v1']`. Las visitas de otras personas no cambian tus ejemplos. «Restablecer demo» borra solo esa copia. Navegadores privados o restricciones de almacenamiento pueden hacer que los cambios duren únicamente durante la visita; se muestra un aviso.

Reportes incluye dos gráficas conectadas: productos más/menos vendidos y demanda por fecha, día de semana u hora. El ranking permite elegir un producto; unidades y libras se analizan por separado. Productos permite combinar categorías y búsqueda, y elegir categoría al agregar/editar.

El botón «Surtío Empresas · Demo» abre `/demo-empresas`: panorama por zona y período, fichas individuales y campañas con borrador, vigencia, activación/pausa y vista previa patrocinada. Las fichas sin autorización simulada no muestran ventas/inventario. Campañas e intereses usan una copia independiente, `localStorage['surtio.companies-demo.v1']`. No hay login administrativo real, anuncios publicados ni solicitudes comerciales. Las funciones operativas presentes aquí son un espacio de prueba: la navegación administrativa habitual de Web conserva su separación de Mobile.

## 1. Probar en tu computadora

En PowerShell:

```powershell
cd "C:\Users\Admin\Desktop\proyecto-construccion-de-software"
npx expo start --web
```

Abre la URL que indique Expo y agrega `/demo`, por ejemplo `http://localhost:8081/demo` si Expo usa ese puerto. La aplicación normal mantiene sus APIs; usa la ruta de demo para la presentación.

Una dirección `localhost` o `10.0.0.31` no sirve como enlace público para personas fuera de tu red. El enlace final debe ser HTTPS y estar publicado.

## 2. Publicar para que cualquiera pruebe sin instalar

Recomendación: **Static Site en Render**, usando el frontend exportado. Render permite publicar sitios estáticos; Expo genera los archivos que necesita el alojamiento. [Render Static Sites](https://render.com/docs/static-sites), [publicación Web de Expo](https://docs.expo.dev/guides/publishing-websites/).

Redis es una base de datos y sistema de caché; no reemplaza el alojamiento Web para compartir esta interfaz. [Introducción oficial a Redis](https://redis.io/tutorials/what-is-redis/).

Pasos después de revisar y subir estos cambios a tu rama:

1. Entra a Render con tu cuenta y elige **New → Static Site**.
2. Conecta el repositorio del frontend y selecciona la rama que contiene estos cambios.
3. Deja **Root Directory** vacío si `package.json` está en la raíz del repositorio.
4. Usa como **Build Command**:

   ```text
   npm ci && npx expo export --platform web
   ```

5. Usa **Publish Directory**: `dist`.
6. En **Environment**, puedes fijar `NODE_VERSION=24.13.1`, versión con la que se verificó este proyecto. Para esta demo no configures MongoDB, credenciales, backend ni URL de API. Expo exporta las páginas estáticas; la demo no las necesita. Una variable `EXPO_PUBLIC_*` es pública, por lo que nunca debe contener secretos.
7. Publica el sitio. Render entregará una URL HTTPS; comparte su ruta `/demo`.
8. Abre directamente `/demo` y recarga la página para comprobar que el alojamiento sirve la ruta estática. El proyecto usa `web.output: "static"`; conserva las páginas generadas. No añadas automáticamente una regla que convierta todas las rutas en `index.html`.
9. Usa el enlace `/demo` para crear el QR de la presentación. Comprueba que el QR abre esa ruta en un teléfono con datos móviles.

No se publicó ningún sitio ni se creó una cuenta desde esta tarea. La URL real y el QR se pueden preparar cuando hayas elegido la cuenta y revisado la demo.

## 3. Ensayo de 2 minutos

1. Abrir `/demo`: verificar la etiqueta «DATOS FICTICIOS».
2. Productos → **Nuevo producto**: agregar un artículo con precio y cantidad. Opcionalmente elegir Cuarta y comprobar que el stock se expresa en libras.
3. Agregar dos panes a la orden y pulsar **Enviar a despacho**.
4. Revisar la modal. Antes de confirmar, todavía no hay una venta nueva ni reducción de stock.
5. **Confirmar despacho**: comprobar la nueva venta arriba en Historial.
6. Filtrar por producto. Abrir detalles de la venta.
7. Reportes: comprobar ingresos de hoy; elegir «Ver últimos 7 días», pulsar una barra y cambiar el patrón a hora o día de semana. Descargar Excel si el navegador lo permite.
8. Alertas: revisar el yogur vencido y el pan próximo a vencer.
9. Recargar: comprobar que los cambios continúan.
10. Abrir «Surtío Empresas · Demo»: filtrar zona, consultar una ficha y crear una campaña. Revisar «Patrocinado» y registrar un interés ficticio; guardar, activar y pausar. Recargar comprueba la persistencia.
11. Restablecer las campañas y la demo del colmado con sus botones separados: volver a los ejemplos iniciales para el siguiente grupo.

Comprobar con Chrome de escritorio y Safari de iPhone, pantalla estrecha y modo oscuro. Probar el enlace publicado fuera del Wi-Fi de desarrollo. Tener la demo cargada en un portátil antes de presentar; se puede mantener una copia exportada como respaldo local.

## Archivos e integración

- `public/surtio-splash-web.png`: nueva imagen horizontal, 1376 × 768, usada en la carga Web antes y después de iniciar JavaScript. Se usa `contain` para conservar el contenido completo; un fondo difuminado llena el espacio restante.
- `src/app/demo.tsx` y `demo.web.tsx`: entrada; disponible en navegador, con redirección al login en Native.
- `src/components/demo/`: pantalla, formulario y modal de demo.
- `src/hooks/use-demo.ts`: persistencia separada.
- `src/types/demo.ts` y `src/utils/demo.ts`: tipos, ejemplos y reglas locales.
- `src/components/report-details.web.tsx`: detalle reutilizado por los reportes reales y la demo.
- `src/app/_layout.tsx`: aisla la ruta `/demo` de providers reales.
- `src/app/demo-empresas.web.tsx` y `src/components/companies/`: panel comercial ficticio y formulario de campañas; también aislado de providers reales.
- `src/components/analytics/`, `src/utils/analytics.ts` y `src/hooks/use-sales-analysis.ts`: gráficas compartidas; el hook obtiene las ventas/productos reales únicamente en Reportes de la aplicación habitual.
- Controles, servicio y utilidades de categorías: catálogo Mobile y formularios, con persistencia local por cuenta hasta que se sincronice el campo en backend.
- [Contrato de categorías, analítica y campañas](backend-handoff-analitica-categorias-campanas.md): integración pendiente y lista de archivos de esta ampliación.
- `src/context/product_context.tsx`: comprueba la URL de API al hacer una operación de API, permitiendo exportar páginas públicas sin un servidor configurado.
- `src/app/login.web.tsx`: valida la URL al intentar iniciar sesión; importar rutas públicas no exige configurar el backend.
- Servicios y contenido de reportes: parámetro opcional para marcar descargas ficticias; los reportes reales conservan su comportamiento.

Sin cambios de backend, sin push, sin credenciales de usuarios reales y sin publicación automática.

## Validación realizada

- `npx tsc --noEmit`: sin errores.
- `node --test scripts/test-business-logic.cjs scripts/test-notifications.cjs scripts/test-demo.cjs scripts/test-analytics.cjs`: 54 pruebas aprobadas, incluyendo conversiones, zona horaria, promedios, períodos rápidos, recuperación de ventas anteriores, detalle ausente, categorías por cuenta, permisos simulados y vigencia de campañas.
- Exportación JavaScript de Web, iOS y Android, más exportación estática Web sin `.env` ni URL de API.
- Demo en Chrome: agregar producto con medida/vencimiento, persistir orden pendiente, despachar, filtrar historial, descargar Excel/PDF ficticios, restablecer e independencia entre visitantes.
- Ninguna solicitud a API durante la demo y ningún cambio al token existente.
- Ampliación del 9 de octubre: ranking conectado al patrón por fecha/semana/hora; filtros de categoría más búsqueda y edición persistida; panel por zona; fichas con/sin autorización simulada; validación, público, vista previa patrocinada, interés, activación, pausa, programación, recarga y restablecimiento de campañas.
- Panel empresarial revisado a 375, 430, 768 y 1440 px. Encabezado sin texto recortado y cambio del tema del sistema verificado en Web; cero errores de página en las tres revisiones de navegador (demo, empresas y aplicación administrativa).
- Sin desbordamiento horizontal a 375, 430, 768 y 1440 px; revisión clara/oscura.
- Aplicación habitual: dashboard, historial, reportes, filtros, calendario, avisos, recuperación de sesión y enlace desde notificaciones sin errores de página.
- Nueva splash horizontal antes de JavaScript y durante la carga React: proporciones conservadas en escritorio y pantalla estrecha. El PNG copiado coincide exactamente con el original.

Queda por comprobar el alojamiento público y Safari en un iPhone real. No se eliminaron archivos.

En el entorno de revisión del 9 de octubre, Chrome canceló el guardado de descargas tanto de reportes como de archivos HTTP/Blob simples. Se verifica por separado el contenido del Excel generado y se conserva la función normal de descarga. Comprobar el guardado del archivo en el navegador del equipo usado para presentar. Los errores de permisos al guardar una exportación dentro de `dist-review` se resuelven en la revisión usando una carpeta de artefactos autorizada; no se cambió la configuración del proyecto.

## Inventario completo del cambio

**Creados:** `public/surtio-splash-web.png`; `src/app/demo.tsx`; `src/app/demo.web.tsx`; `src/components/demo/demo-screen.web.tsx`; `src/components/demo/demo-product-form.web.tsx`; `src/components/demo/demo-dialog.tsx`; `src/components/report-details.web.tsx`; `src/hooks/use-demo.ts`; `src/types/demo.ts`; `src/utils/demo.ts`; `scripts/test-demo.cjs`; `docs/demo-presentacion.md`; `docs/analitica-modelo-negocio-surtio.md`.

**Modificados:** `src/app/+html.tsx`; `src/app/_layout.tsx`; `src/app/login.web.tsx`; `src/components/startup-splash.tsx`; `src/components/reports-screen.web.tsx`; `src/context/product_context.tsx`; `src/services/report-exports.web.ts`; `src/utils/report-content.ts`; `docs/web-mobile-vencimientos.md`.

**Eliminados:** ninguno. Los directorios de exportación y las capturas de verificación no forman parte del código publicado en Git.
