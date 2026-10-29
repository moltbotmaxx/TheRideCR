# TheRideCR

Sitio público: https://theridecr.net/

Admin independiente: https://theridecr-admin.capital-mind-4840.chatgpt.site/admin/

## Arquitectura

- Sitio público React/Vite en GitHub Pages, rama `gh-pages`.
- API de reservas y PWA Admin en un Cloudflare Worker alojado por Sites.
- Base de datos D1 real: reservas, suscripciones push, límites de solicitudes y cola de avisos.
- Admin usa la sesión verificada de Sites mediante **Iniciar sesión con ChatGPT**. Solo se autoriza el correo `ADMIN_EMAIL` en servidor. No hay contraseña compartida ni registro público de administradores.
- Push Web estándar con VAPID, payload cifrado y claves privadas guardadas únicamente como secretos del runtime.

## Usar Admin

1. Abrir la URL Admin e iniciar sesión con la cuenta ChatGPT de `tbnalfaro@gmail.com`.
2. Instalar Admin desde el menú del navegador. En iPhone/iPad: Compartir → Agregar a pantalla de inicio, y abrir el icono instalado (iOS/iPadOS 16.4 o posterior).
3. Pulsar **Activar avisos**, conceder permiso y pulsar **Probar aviso**.
4. Cada dispositivo se registra por separado. **Salir** elimina la suscripción del dispositivo antes de cerrar sesión.

Las reservas se guardan antes de enviar avisos. Los errores transitorios de push se reintentan una vez tras unos segundos; los errores posteriores quedan en cola y se reintentan con nueva actividad del backend. No hay scheduler autónomo. Los avisos dependen del permiso, del sistema operativo y del proveedor push; la lista del Admin consulta el servidor al abrirse y cada 20 segundos mientras está visible.

El modo sin conexión muestra una pantalla informativa. No almacena reservas ni datos de clientes en caché.

## Desarrollo y verificación

```sh
npm ci
cp .env.example .env.local
npm run build:backend
npm test
npm run dev:backend
```

`dev:backend` sirve `http://127.0.0.1:8787/admin/`, con D1 persistente en `.data/d1` y una identidad simulada **solo en el adaptador local**. El Worker de producción no incluye esa simulación. No envía push localmente sin claves VAPID. El sitio público puede previsualizarse con `npm run dev` (usar `VITE_API_BASE_URL=http://127.0.0.1:8787` para API local y añadir su origen a `PUBLIC_ORIGINS` en el adaptador).

`npm run build` genera el sitio público en `dist/`. `npm run build:backend` conserva ese sitio en `build/public/`, compila Admin y genera el Worker de Sites en `dist/server/index.js`. El Admin se empaqueta dentro del Worker, sin depender de GitHub Pages.

`npm test` verifica persistencia SQLite/D1, autorización, precios de servidor, validaciones, concurrencia/idempotencia, CORS, cambios y borrado, suscripción push y envío cifrado contra transporte simulado. No sustituye la prueba de entrega en un teléfono real.

## Configuración

Variables públicas de build: ver `.env.example`. No introducir secretos en variables `VITE_*`.

Runtime de Sites:

- `ADMIN_EMAIL`: correo único autorizado.
- `PUBLIC_ORIGINS`: orígenes públicos permitidos, separados por coma.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (secreto), `VAPID_SUBJECT`.
- Binding D1 `DB`, declarado en `.openai/hosting.json`.

Mantener el par VAPID estable: cambiarlo obliga a renovar las suscripciones de los teléfonos. Las cabeceras `oai-authenticated-user-*` solo se confían detrás del dispatch autenticado de Sites. Otro hosting necesita su propia verificación de identidad; no publicar directamente el Worker en un endpoint que permita suplantarlas.

Las tarifas autoritativas están en `worker/pricing.js`. El servidor ignora el precio y estado enviados por el cliente. Las rutas no predefinidas quedan **por cotizar**. La recogida siempre se interpreta en hora de Costa Rica (UTC−6). No se inventan distancias ni tiempos cuando Maps no está disponible. Las solicitudes requieren confirmación manual de disponibilidad; no se procesan pagos ni se bloquea inventario/calendario.

Las migraciones están en `drizzle/`. Para modificar el esquema, editar `worker/schema.js`, ejecutar `npm run db:generate` y publicar el código junto a las nuevas migraciones. No modificar migraciones ya aplicadas. Sites aplica las migraciones al publicar y conserva D1 entre versiones.

## Publicación

Conservar el `project_id` existente y usar el workflow del plugin Sites para sincronizar el repositorio fuente y publicar el artefacto. No crear otro Site para una actualización. El hosting del backend y GitHub Pages son publicaciones independientes.

Para publicar el sitio público, compilar con los valores de `.env.example` y actualizar la rama `gh-pages` con el contenido de `dist/` (o `build/public/` tras el build del backend), manteniendo `CNAME`. Nunca subir secretos, `.data/` ni archivos del servidor a Pages.

## SEO

HTML inicial rastreable con contenido de airport transfers SJO/LIR y last-minute pickup sujeto a disponibilidad. React conserva una sección visible equivalente en inglés/español. Canonical, metadatos sociales, JSON-LD basado en información verificada, `robots.txt` y `sitemap.xml` apuntan al dominio público. Admin y API envían `noindex`.

Para seguimiento y solicitud de indexación, verificar la propiedad `theridecr.net` en Google Search Console y enviar `https://theridecr.net/sitemap.xml`. La publicación del sitemap no garantiza indexación ni posiciones. No se incluyen reseñas, direcciones, horarios ni garantías de disponibilidad inventadas.
