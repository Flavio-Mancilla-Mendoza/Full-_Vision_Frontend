# Mapa de Lambdas / Handlers

Este documento lista los archivos que exportan handlers Lambda o puntos de entrada relacionados encontrados en el repositorio, con una breve nota sobre su responsabilidad.

## infrastructure/lambda

- infrastructure/lambda/public-api/index.js — Handler público (API) principal (exports.handler).
- infrastructure/lambda/pre-signup/index.js — Handler para el flujo pre-signup (Cognito pre-signup).
- infrastructure/lambda/post-confirmation/index.js — Handler para post-confirmation (Cognito post-confirmation).
- infrastructure/lambda/image-processor/index.js — Procesamiento/transformación de imágenes (exports.handler).
- infrastructure/lambda/image-optimization/index.js / index.ts — Optimizaciones en CloudFront (CloudFront response handler).
- infrastructure/lambda/admin-user-management/index.js — Handler para gestión de usuarios/admin (exports.handler).

## packages (proxies y handlers empaquetados)

- packages/lambda-proxy/index.js — Proxy genérico que enruta handlers (`exports.handler`).
- packages/lambda-proxy/handlers/\* — Handlers y router internos utilizados por el proxy.
- packages/lambda-proxy-products/index.js — Proxy/handler para productos.
- packages/lambda-proxy-public/index.js — Proxy/handler público.
- packages/lambda-proxy-uploads/index.js — Proxy/handler de uploads.

## Código compartido

- packages/\*/shared/s3.js — helpers S3 (presigned URLs).
- packages/\*/shared/supabaseClient.js — cliente Supabase compartido.
- packages/shared — utilidades compartidas entre lambdas/proxies.

## Observaciones

- Antes tenías "un lambda" monolítico; ahora el código está dividido en múltiples lambdas y proxies. Esto parece una separación por responsabilidad (auth hooks, image processing, public API, proxies para distintos dominios).
- Si quieres revertir a un único lambda debes decidir cuál es la fuente de verdad (infraestructura vs packages) y consolidar handlers y dependencias.

## Siguientes pasos sugeridos

- Generar un mapeo más detallado con resumen de funciones internas por archivo (si lo deseas puedo abrir cada handler y extraer responsabilidades línea a línea).
- Crear documentación de despliegue para cada lambda (nombres en CloudFormation/CDK, variables de entorno necesarias).

---

Generado automáticamente por revisión rápida del repositorio.
