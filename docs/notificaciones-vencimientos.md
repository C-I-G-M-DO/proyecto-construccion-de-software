# Alertas y notificaciones de Surtío

## Frontend implementado

- Actividad reciente se retiró de Inicio en Web y Mobile. Los registros y filtros continúan en Historial.
- Alertas usa el mismo componente en ambas plataformas: vencidos, próximos siete días, lotes fuera de alerta y productos con fecha desconocida. Usa solamente los lotes confirmados por `GET /api/products`.
- Activación voluntaria, permisos, prueba, desactivación, errores y persistencia. No se solicita permiso automáticamente al iniciar.
- **Mobile local:** un resumen diario alrededor de las 09:00, hasta treinta días, con cantidades/fechas consultadas. Si se activa después de las 09:00, presenta el resumen de hoy inmediatamente. Se actualiza al abrir, volver al primer plano, navegar o recargar Alertas. No repite el mismo día por reload. El sistema puede retrasar la entrega por ahorro de energía o ajustes. Estos avisos programados pueden aparecer con la app cerrada; no son push de servidor. Las existencias de otros equipos no se actualizan mientras esta app esté cerrada.
- **Web local:** un resumen del día al abrir Surtío. Una página cerrada no ejecuta consultas. La recepción con la página cerrada corresponde a Web Push y requiere el servidor.
- **Push remoto:** registro Expo, suscripción Web Push, recepción en service worker, apertura de Alertas y bajas con reintento. El botón se habilita únicamente con entorno/servicio configurados. La interfaz confirma activación solo después de confirmar el registro en servidor.
- Logout cancela los avisos locales de Surtío y da de baja la suscripción Web. La baja de servidor se guarda antes de olvidar el registro y se reintenta cuando vuelva la conexión mediante una credencial limitada; no se conserva el JWT para ese reintento. Cambiar de cuenta desactiva la configuración anterior.
- Los avisos resumen cantidades de lotes; no incluyen nombres de clientes/productos. Tocar un aviso abre solo Surtío, luego Alertas si hay sesión.

**Estado real:** no se editó el backend, no existe envío remoto funcionando por este cambio y no se crearon credenciales ni proyecto EAS. Expo Go permite probar avisos locales; las push de Surtío requieren una compilación propia y credenciales. No se llaman endpoints propuestos si `EXPO_PUBLIC_NOTIFICATIONS_URL` está sin configurar.

## Contrato para el compañero del backend

Primero implementar la persistencia de lotes descrita en [web-mobile-vencimientos.md](web-mobile-vencimientos.md). Sin `lotes[].fechaVencimiento` y `cantidadDisponible`, el frontend no inventa alertas.

Estas rutas son un **contrato propuesto** que el frontend ya puede consumir. Configurar después su base mediante `EXPO_PUBLIC_NOTIFICATIONS_URL`, por ejemplo `https://api.del-negocio/api/notifications`. Es un ejemplo, no un servidor existente.

Si Web y API usan orígenes distintos, configurar CORS para los orígenes de Surtío, métodos `GET`, `POST`, `DELETE` y sus solicitudes `OPTIONS`; permitir las cabeceras `Authorization`, `Content-Type` y `X-Surtio-Notification-Revoke`. Mantener la URL de esa base estable para que las bajas pendientes puedan reintentarse.

### Configuración: `GET /config`

Requiere `Authorization: Bearer <token>` y devuelve:

```json
{ "expoEnabled": true, "webEnabled": true, "vapidPublicKey": "CLAVE_PUBLICA_VAPID_BASE64URL" }
```

Habilitar cada transporte solo si el envío está configurado. La clave pública Web es P-256 de 65 bytes sin comprimir, codificada base64url. La clave privada VAPID y las credenciales APNs/FCM nunca se envían a la app.

### Registro: `POST /subscriptions`

Requiere Bearer. El cuerpo es uno de los siguientes:

```json
{ "kind": "expo", "platform": "ios", "token": "ExponentPushToken[...]" }
```

```json
{
  "kind": "web",
  "subscription": {
    "endpoint": "https://servicio-push-del-navegador/...",
    "expirationTime": null,
    "keys": { "p256dh": "...", "auth": "..." }
  }
}
```

Respuesta `200` o `201`:

```json
{ "id": "id-registro", "revokeToken": "CREDENCIAL_ALEATORIA_BASE64URL_DE_32_BYTES" }
```

Validar transporte, tamaño/formato de token y suscripción. Aceptar solamente endpoints HTTPS de proveedores admitidos para evitar solicitudes arbitrarias desde el servidor. Derivar usuario y negocio del JWT verificado; no autorizar con un `storeId` del cliente.

Deduplicar por token/endpoint y reemplazar su dueño atómicamente: un dispositivo no debe conservar registros de dos cuentas. Crear una credencial aleatoria de revocación (32 bytes base64url, 43 caracteres), guardar su hash y devolverla solo al registrar. El cliente admite `id` alfanumérico con guion/guion bajo de hasta 128 caracteres y credencial URL segura de 32 a 256 caracteres. Un nuevo registro invalida las credenciales anteriores: una baja vieja nunca debe borrar un registro posterior del dispositivo. Limitar intentos y no registrar tokens completos en logs.

Restringir la vigencia del registro a la sesión autorizada, actualmente siete días. Al volver a iniciar sesión se registra nuevamente. No conservar indefinidamente dispositivos cuya sesión haya vencido.

### Baja: `DELETE /subscriptions/:id`

El cliente envía `X-Surtio-Notification-Revoke: <revokeToken>`. Esa credencial debe permitir **solo eliminar ese registro**, sin acceso a datos ni otras operaciones. Comparar su hash de forma segura y limitar intentos. La baja puede reintentarse sin conservar la sesión después de logout. Puede existir además una baja autenticada para administración.

Responder `204`; `404`/`410` se consideran ya dado de baja. Rechazar credenciales incorrectas. El frontend conserva bajas cuando hay error/falta de conexión y reintenta al iniciar, navegar o activar avisos. Una notificación ya en tránsito no siempre puede retirarse del sistema; su contenido es genérico por ese motivo.

### Trabajo diario y entrega

1. Ejecutar el trabajo a las 09:00 en la zona del negocio; acordar `America/Santo_Domingo` para RD. El frontend local usa fecha/hora del teléfono, una diferencia a considerar en equipos configurados en otra zona.
2. Consultar por negocio lotes con `cantidadDisponible > 0` y fecha vencida, de hoy o hasta siete días después. No notificar agotados ni declarar seguras fechas desconocidas.
3. Enviar un resumen por negocio/dispositivo/día. Persistir una clave única de deduplicación y reservarla atómicamente para evitar duplicados entre trabajadores. Excluir registros revocados o con sesión vencida antes del envío.
4. Expo: configurar APNs/FCM, procesar tickets y receipts, eliminar `DeviceNotRegistered`. Web Push: configurar VAPID y eliminar endpoints con `404`/`410`. Reintentar fallos temporales/`429` con espera incremental sin duplicar entregas confirmadas.
5. Si se necesitan eventos inmediatos además del resumen diario, acordar eventos y deduplicación; no inferir desde el frontend una política de consumo de stock.

Payload Expo (sustituir token/texto):

```json
{
  "to": "ExponentPushToken[...]",
  "title": "Surtío · Alertas de vencimiento",
  "body": "2 lotes por vencer. Revisa Alertas en Surtío.",
  "sound": "default", "channelId": "surtio-expiry",
  "data": { "scope": "surtio-expiry", "url": "/alerts" }
}
```

Payload Web:

```json
{ "title": "Surtío · Alertas de vencimiento", "body": "2 lotes por vencer. Revisa Alertas en Surtío.", "tag": "vencimientos-NEGOCIO-FECHA" }
```

El worker ignora URLs recibidas y abre `/?notification=expiry` en el mismo origen. Sin sesión muestra Login. Los detalles se consultan al entrar a Alertas.

## Configurar y probar

### Ahora con Expo Go

1. Ejecutar `npm install` y reiniciar `npx expo start -c`.
2. Abrir Alertas en el iPhone, pulsar **Activar avisos locales**, permitirlos y pulsar **Probar aviso**. El sistema identifica esos avisos como pertenecientes a Expo Go.
3. Con lotes confirmados por el backend, probar fecha de hoy, mañana, vencida y cantidad agotada. Sin fechas no se inventan notificaciones.
4. Recargar y comprobar que el resumen de hoy no se repite. Desactivar o cerrar sesión cancela los avisos de Surtío, sin cancelar avisos ajenos.

### Push móvil después

Crear un proyecto EAS y development/release build. Usar dispositivo físico, projectId real en `extra.eas.projectId` o `EXPO_PUBLIC_EAS_PROJECT_ID` y credenciales APNs/FCM. Configurar `EXPO_PUBLIC_NOTIFICATIONS_URL` cuando estén implementadas sus rutas. Credenciales privadas en EAS/servidor. Reconstruir al cambiar plugins nativos. Probar registro, entrega real con app cerrada, toque del aviso, logout sin conexión y sesión vencida. **Todavía no se verificó la entrega remota de extremo a extremo**, porque faltan servidor, credenciales y compilación propia.

### Web

HTTPS en producción; `localhost` sirve para pruebas. La URL LAN `http://10.0.0.31` no habilita estas APIs por ser un contexto inseguro. En iPhone instalar la Web en la pantalla de inicio y usar un sistema compatible. Publicar `public/` en la raíz, servir el worker como JavaScript y no reemplazar esa ruta por HTML. El worker no intercepta ni almacena consultas del negocio; no añade funcionamiento offline.

Probar los avisos locales desde Alertas. Para push con página cerrada, implementar el servidor/VAPID, configurar la URL y activar push. Cambiar entre local y push cancela la modalidad anterior.

## Splash antes del bundle

- **Web:** `src/app/+html.tsx` muestra la foto pública antes de JavaScript; el layout la retira cuando arranca React. `object-fit: contain` conserva toda la foto y un fondo desenfocado llena el espacio extra. Después permanece la pantalla React mientras recupera la sesión. No se añade espera artificial.
- **iOS propio:** `app.json` configura la foto proporcional con `enableFullScreenImage_legacy`, disponible en SDK 57. Es una opción de transición que Expo puede retirar; revisarla al actualizar SDK. Reconstruir y comprobar en iPhone físico.
- **Expo Go:** su pantalla blanca «Building JavaScript bundle» con el icono no se reemplaza desde el proyecto. La foto de Surtío aparece cuando está listo su JavaScript.
- **Android:** la pantalla del sistema conserva el icono; Android 12+ restringe esa pantalla. La foto completa aparece en la pantalla React posterior.

## Archivos

Modificados: `app.json`, `package.json`, `package-lock.json`, dashboards Web/Mobile, layout Web, layout raíz, índice, perfil, rutas Alertas, guía `web-mobile-vencimientos.md` y pruebas `scripts/test-business-logic.cjs`.

Nuevos: `src/app/+html.tsx`, `src/components/alerts-screen.tsx`, `src/components/notification-settings.tsx`, `src/context/notification-context.tsx`, `src/types/notifications.ts`, `src/utils/notification-plan.ts`, servicios `notification-api.ts`, `notifications.ts`, `notification-device.ts`, `notification-device.native.ts`, `notification-device.web.ts`, `public/surtio-notifications-sw.js`, `public/manifest.webmanifest`, `public/surtio-icon.png`, `public/surtio-splash.png`, `scripts/test-notifications.cjs` y esta guía. Los PNG públicos son copias de los assets suministrados para URLs disponibles antes de JavaScript y para el worker. No se eliminaron archivos.

```powershell
npx tsc --noEmit
node --test scripts/test-business-logic.cjs scripts/test-notifications.cjs
```

Verificación realizada: TypeScript sin errores y 23 pruebas aprobadas. Navegador limpio: Inicio sin actividad reciente, historial/filtros, calendarios y reportes, Alertas Web, activación de avisos locales, permiso, persistencia/deduplicación tras reload, registro del worker, desactivación y apertura de Alertas desde el enlace de notificación. Anchos de 1440, 768 y 430 px sin desbordamiento horizontal; foto proporcional antes de JavaScript a 1440 × 1000 y 428 × 926. Cero errores de página. Exportación de JavaScript Web/iOS/Android completada con `--no-bytecode` por la restricción del entorno al ejecutar el compilador de Hermes. No es una compilación nativa de distribución.

Estas pruebas son aisladas: no envían push reales ni modifican el backend. La exportación tampoco sustituye una prueba en dispositivo físico. Los avisos locales también actualizan sus datos cuando cambia el día con la aplicación abierta.

Referencias: [Notifications SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [configurar push Expo](https://docs.expo.dev/push-notifications/push-notifications-setup/), [splash SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/), [Web Push](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe).
