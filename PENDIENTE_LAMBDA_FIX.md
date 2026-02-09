# PENDIENTE - Fix Lambda supabase-products (5 Feb 2026)

## Estado: Lambda /cart FUNCIONA ✅ — Quedan tareas de limpieza

---

## ¿Qué se arregló?

El endpoint `/cart` devolvía **502 (Bad Gateway)** porque la Lambda `full-vision-supabase-products-dev` crasheaba con:
```
Runtime.UserCodeSyntaxError: SyntaxError: Cannot use import statement outside a module
```

### Fixes aplicados:

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| 1 | `infrastructure/lambda/supabase-products/lib/product-utils.js` | Usaba `export function` (ESM) en un paquete CommonJS | ✅ Convertido a CJS |
| 2 | `infrastructure/lambda/supabase-products/shared/cors.js` | No existía — el `require('../shared/cors')` apuntaba fuera del paquete Lambda | ✅ Copiado dentro del paquete + rutas actualizadas |
| 3 | `infrastructure/lambda/supabase-products/package.json` | `@aws-sdk/client-s3@^3.600.0` traía `strnum@2.x` con `"type":"module"` | ✅ Pinned a `3.750.0` |
| 4 | **`infrastructure/lambda/supabase-products/lib/s3.js`** | **Tenía CJS + ESM concatenados** (líneas 1-26 CJS, líneas 27-64 ESM duplicado) | ✅ Eliminada parte ESM |

### Deploy actual:
- Se hizo deploy directo con `aws lambda update-function-code` (no CDK)
- La Lambda carga correctamente y rutea `/cart` al handler
- Test con evento simulado devuelve respuesta de Supabase (error esperado por UUID falso)

---

## PENDIENTE para mañana

### 1. ✅ Convertir los 15 archivos ESM restantes a CJS
**COMPLETADO (8 Feb 2026)** — 13 archivos convertidos de `export`/`import` a `module.exports`/`require()`, 2 eliminados (`lib/router.js` y `lib/supabase.js` eran duplicados muertos). Deploy exitoso via CDK.

**handlers/**
- `appointments.js`
- `bestsellers.js`
- `brands.js`
- `dynamicFilters.js`
- `liquidacion.js`
- `mercadoPago.js`
- `orders.js`
- `productsByGender.js`
- `profile.js`
- `siteContent.js`

**lib/**
- `auth.js`
- `logger.js`
- `request.js`
- `router.js` (hay dos routers: este ESM y `handlers/router.js` CJS — el CJS es el que se usa)
- `supabase.js` (hay dos: este ESM y `lib/supabaseClient.js` CJS — el CJS es el que se usa)

**Opción A:** Convertirlos a CJS (como se hizo con `product-utils.js` y `s3.js`)
**Opción B:** Eliminarlos si son duplicados obsoletos de una migración anterior

### 2. ✅ Hacer deploy con CDK (no solo AWS CLI)
**COMPLETADO** — Múltiples deploys exitosos con `npx cdk deploy --all`.
```bash
cd infrastructure
# Borrar cache de assets
Remove-Item -Recurse -Force cdk.out -ErrorAction SilentlyContinue
npx cdk deploy --profile default --context environment=dev
```

### 3. ❌ Probar el carrito end-to-end desde el frontend
1. Levantar el frontend: `pnpm run dev`
2. Loguearse con Cognito
3. Agregar producto al carrito
4. Verificar que `/cart` responde correctamente con JWT real

### 4. ❌ Limpiar directorio test-minimal
Existe `infrastructure/lambda/test-minimal/` que se creó para debugging. Eliminar:
```bash
Remove-Item -Recurse -Force infrastructure\lambda\test-minimal
```

### 5. ❌ Revisar si `@aws-sdk/client-s3@3.750.0` es suficiente
Se pinned a 3.750.0 para evitar ESM transitivo. Verificar que las funcionalidades de S3 (presigned URLs) funcionan con esta versión.

---

## Archivos clave modificados
```
infrastructure/lambda/supabase-products/
├── index.js                    # require('./shared/cors') (antes '../shared/cors')
├── package.json                # @aws-sdk/client-s3 pinned 3.750.0
├── shared/cors.js              # NUEVO - copia del shared global
├── handlers/
│   ├── router.js               # require('../shared/cors') (antes '../../shared/cors')
│   ├── cart.js                 # require('../shared/cors') (antes '../../shared/cors')
│   └── public.js               # require('../shared/cors') (antes '../../shared/cors')
└── lib/
    ├── s3.js                   # ELIMINADA parte ESM duplicada (líneas 27-64)
    └── product-utils.js        # CONVERTIDO de ESM a CJS
```

## Cómo replicar el deploy
```powershell
cd infrastructure\lambda\supabase-products
npm install  # ya tiene node_modules con versiones correctas

# Opción 1: Deploy directo
$zip = "deploy-temp.zip"
Compress-Archive -Path index.js,package.json,handlers,lib,shared,node_modules -DestinationPath $zip -Force
aws lambda update-function-code --function-name full-vision-supabase-products-dev --zip-file "fileb://$zip" --profile default --region sa-east-1

# Opción 2: CDK (recomendado para producción)
cd ../../
Remove-Item -Recurse -Force cdk.out -ErrorAction SilentlyContinue
npx cdk deploy --profile default --context environment=dev
```
