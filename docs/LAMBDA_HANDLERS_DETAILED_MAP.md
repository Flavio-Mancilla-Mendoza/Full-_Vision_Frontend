# Mapa Detallado de Lambdas y Handlers

Este documento resume los puntos de entrada (handlers) localizados en el repositorio, describe su responsabilidad principal, variables de entorno relevantes y notas para seguir con la división/consolidación del lambda monolítico.

---

## infrastructure/lambda

### `infrastructure/lambda/public-api/index.js`

- Export: `exports.handler`
- Responsabilidad: Placeholder de API pública; actualmente devuelve un mensaje simple. Parece un stub/placeholder para una función pública.
- Env vars: Ninguna usada explícitamente.
- Nota: Si solía contener lógica de API, revisar versiones anteriores en VCS; actualmente no hay lógica que migrar.

### `infrastructure/lambda/pre-signup/index.js`

- Export: `exports.handler`
- Responsabilidad: Trigger Cognito Pre Sign-Up. Valida emails, dominios permitidos y auto-confirma ciertos correos (ej. `@fullvision.com`).
- Env vars: `ALLOWED_DOMAINS`, `LOG_LEVEL`.
- Recomendación para división: Es un handler específico de auth → mantener como Lambda trigger independiente. Documentar dominios permitidos y tests de validación.

### `infrastructure/lambda/post-confirmation/index.js`

- Export: `exports.handler`
- Responsabilidad: Trigger Cognito Post Confirmation. Crea perfil de usuario en base de datos (placeholders / TODOs para conexión a RDS/Secrets Manager).
- Env vars: `LOG_LEVEL`, `DATABASE_ENDPOINT`, `AWS_REGION` (indirecto al SecretsManagerClient).
- Recomendación: Mantener handler independiente. Implementar/extraer código de DB a módulo compartido (ej. `packages/shared/db`) si se reutiliza.

### `infrastructure/lambda/image-processor/index.js`

- Export: `exports.handler`
- Responsabilidad: Placeholder para procesamiento de imágenes (actualmente stub que retorna mensaje).
- Nota: Revisar si la lógica real se movió a `image-optimization` o a otros paquetes.

### `infrastructure/lambda/image-optimization/index.ts`

- Export: `export const handler`
- Responsabilidad: Lambda@Edge (CloudFront Origin/Response) que optimiza imágenes con `sharp` según query params (`w`, `q`) y convierte a WebP cuando el cliente lo soporta. Recupera objetos desde S3 y devuelve body base64.
- Env vars: `S3_BUCKET_NAME`.
- Recomendación: Mantener como Lambda@Edge separado. Extraer utilidades S3/transform en un módulo si se comparte.

### `infrastructure/lambda/admin-user-management/index.js`

- Export: `exports.handler`
- Responsabilidad: Handler HTTP (API) para operaciones administrativas de usuarios sobre Cognito (crear usuario, set password). Soporta CORS, parsing JSON y llamadas al SDK de Cognito.
- Env vars: `AWS_REGION`, `USER_POOL_ID`.
- Recomendación: Mantener separado (admin API). Si hay múltiples rutas admin en el monolito, considera agrupar funcionalidades relacionadas aquí o delegar a un proxy más pequeño.

---

## packages (proxies y handlers empaquetados)

> Nota: `packages/lambda-proxy` y derivados actúan como "adapters/proxy" que exponen endpoints HTTP (HTTP API / REST API) y enrutan internamente a handlers implementados en JS (supabase-backed).

### `packages/lambda-proxy/index.js`

- Export: `exports.handler`
- Responsabilidad: Proxy genérico que normaliza eventos HTTP (v1/v2) y llama a `handlers/router`. Maneja preflight CORS.
- Env vars: `LOG_LEVEL`.
- Recomendación: Mantener proxy; facilita agrupar lógicas por dominio (products/public/uploads). Si quieres un único lambda, este archivo sería el punto natural para reintroducir el router central.

### `packages/lambda-proxy/handlers/router.js`

- Export: `route(normalizedRequest)`
- Responsabilidad: Router que decide qué handler ejecutar según método y path (`/public/site-content`, `/public/products`, `/products/upload-url`, etc.)
- Recomendación: Seguir manteniendo rutas pequeñas, cada handler (`public.js`) contiene lógica contra Supabase.

### `packages/lambda-proxy/handlers/public.js`

- Export: `getSiteContent`, `getProducts`, `getProductById`, `productsUploadUrl`
- Responsabilidad: Implementaciones de endpoints públicos que usan `supabase` (cliente) y `s3` (presigned upload URL generation).
- Env vars: Usa `packages/lambda-proxy/lib/supabaseClient.js` y `lib/s3.js` (por tanto hereda `SUPABASE_*` e `IMAGES_BUCKET_NAME`, etc.).
- Recomendación: Separar handlers por dominio (site-content, products). Cada función ya está lo bastante pequeña para extraer a lambdas separados si se desea (ej. `products-api`, `site-content-api`).

### `packages/lambda-proxy/lib/s3.js` (y variantes en otros packages)

- Export: `generatePresignedUrl`, `generatePresignedUploadUrl` (CommonJS + ESM duplicado en el mismo archivo — hay código repetido/mezclado).
- Responsabilidad: Generación de URLs firmadas S3.
- Env vars: `IMAGES_BUCKET_NAME`, `S3_REGION`.
- Observación importante: El archivo contiene código CommonJS seguido por ESM exports duplicados; revisar y unificar (puede provocar problemas en build).
- Recomendación: Consolidar librerías compartidas en `packages/shared` y estandarizar formato (CJS o ESM), actualizar bundles de lambdas.

### `packages/lambda-proxy/lib/supabaseClient.js`

- Export: `supabase` (cliente Supabase usando `SUPABASE_SERVICE_ROLE_KEY`)
- Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Recomendación: Mantener cliente compartido, pero cuidar que la llave service role no se escape en lambdas públicos.

### Otros packages proxies

- `packages/lambda-proxy-products/index.js`, `packages/lambda-proxy-public/index.js`, `packages/lambda-proxy-uploads/index.js`
  - Responsabilidad: Variantes del proxy/handler empaquetadas para despliegue independiente (productos, público, uploads). Exportan `exports.handler` y probablemente reutilizan `handlers` y `lib` locales.
  - Recomendación: Identificar diferencias entre proxies (si son solo empaquetados con distintas rutas/envs) y documentar para CDK/CloudFormation.

---

## Código compartido encontrado

- `packages/*/shared/s3.js` — helpers S3 (presigned URLs). Usado por varios proxies.
- `packages/*/shared/supabaseClient.js` — cliente Supabase compartido.
- `packages/shared` — utilidades compartidas (revisar para consolidación).

---

## Problemas / puntos de atención para seguir con la división

1. Duplicación de código y formato mixto ESM/CJS en `lib/s3.js`: unificar y mover a `packages/shared`.
2. Variables de entorno sensibles (SERVICE_ROLE keys) deben limitarse al scope necesario y documentarse en CDK.
3. Los triggers Cognito (`pre-signup`, `post-confirmation`) son handlers específicos y conviene no mezclarlos con proxies HTTP.
4. Lambda@Edge (`image-optimization`) debe permanecer separado por requisitos de despliegue y runtime (sharp, binarios). Documentar el pipeline de build (sharp necesita binarios para Lambda@Edge).
5. Si quieres revertir a un único lambda monolítico:
   - Identifica las dependencias compartidas y resuelve conflictos ESM/CJS.
   - Decide el punto de entrada (por ejemplo `packages/lambda-proxy/index.js`) y copia/integra handlers de `infrastructure/lambda/*` según correspondan.
   - Actualiza `cdk`/infrastructure para apuntar al handler consolidado.

---

## Siguientes pasos recomendados (puedo ejecutar)

- [ ] Extraer y unificar `lib/s3.js` en `packages/shared` y actualizar imports (te lo preparo en un PR).
- [ ] Generar un listado por cada proxy (`products`, `public`, `uploads`) con rutas expuestas y permisos de env vars.
- [ ] Revisar duplicados CJS/ESM y estandarizar a ESM si tu build/tooling lo permite.
- [ ] Si deseas, preparo un plan para consolidar handlers en un único lambda y los cambios de CDK necesarios.

---

Generado automáticamente después de inspeccionar handlers clave en `infrastructure/lambda` y `packages/*`.
