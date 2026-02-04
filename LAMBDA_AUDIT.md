# 📊 Auditoría de Lambda - Estado Actual de Migración

## 🔍 Resumen Ejecutivo

**Estado actual:** Migración parcial - Solo endpoints públicos y de lectura están en Lambda  
**Objetivo:** Migrar todas las operaciones admin a Lambda siguiendo patrón USE_PROXY_API  
**Prioridad:** Implementar POST/PUT/DELETE para productos (admin operations)

---

## 📦 Lambda Functions Desplegadas en AWS

Según `full-vision-lambdas-metadata.json`, hay 7 Lambdas activas:

| Lambda | Runtime | Handler | Timeout | Memory | Uso |
|--------|---------|---------|---------|--------|-----|
| **full-vision-supabase-products-dev** | nodejs20.x | index.handler | 30s | 512MB | ✅ Productos (GET/POST/PUT) |
| **full-vision-supabase-public-dev** | nodejs20.x | index.handler | 30s | 512MB | ✅ Site Content (público) |
| **full-vision-public-api-dev** | nodejs20.x | index.handler | 15s | 512MB | ✅ API pública general |
| **full-vision-admin-user-management-dev** | nodejs20.x | index.handler | 30s | 256MB | 👥 Gestión usuarios Cognito |
| **full-vision-post-confirmation-dev** | nodejs20.x | index.handler | 30s | 512MB | 🔐 Cognito trigger |
| **full-vision-pre-signup-dev** | nodejs20.x | index.handler | 10s | 256MB | 🔐 Cognito trigger |
| **full-vision-image-processor-dev** | nodejs20.x | index.handler | 60s | 1024MB | 🖼️ Procesamiento imágenes |

---

## 📁 Paquetes Lambda en el Proyecto (Local)

### 1️⃣ **packages/lambda-proxy/** (Principal - Router completo)

**Estado:** ✅ Implementado con router modular  
**Archivos:**
- `index.js` - Handler principal con normalización de requests
- `handlers/router.js` - Routing system
- `handlers/products.js` - Handler de productos con lógica completa
- `handlers/appointments.js`, `brands.js`, `orders.js`, etc.

**Endpoints implementados en router.js:**
```javascript
GET /public/site-content
GET /public/products
GET /public/products/{id}
POST /products/upload-url
```

**Endpoints en products.js (código local):**
```javascript
GET /products - Lista todos los productos
GET /products/{id} - Producto individual
POST /products [action=check-sku] - Verificar SKU duplicado
POST /products [action=check-slug] - Verificar slug duplicado  
POST /products [action=generate-sku] - Generar SKU automático
POST /products - Crear producto (línea 128+)
PUT /products/{id} - Actualizar producto
DELETE /products/{id} - Eliminar producto
```

**⚠️ PROBLEMA:** `router.js` solo rutea 4 endpoints públicos. Los otros handlers NO están integrados.

---

### 2️⃣ **packages/lambda-proxy-products/**

**Estado:** ⚠️ Implementación básica (solo GET)  
**Archivo:** `index.js`

**Endpoints implementados:**
```javascript
GET /products - Lista productos
GET /products/{id} - Detalle producto
```

**❌ Faltantes:** POST, PUT, DELETE

---

### 3️⃣ **packages/lambda-proxy-public/**

**Estado:** ✅ Completo para casos de uso público  
**Archivo:** `index.js`

**Endpoints implementados:**
```javascript
GET /public/site-content - Todo el contenido del sitio
GET /public/site-content/{section} - Contenido por sección
```

---

### 4️⃣ **packages/lambda-proxy-uploads/**

**Estado:** ✅ Completo  
**Archivo:** `index.js`

**Endpoints implementados:**
```javascript
POST /upload-url - Generar presigned URL de S3
PUT /upload-url - Generar presigned URL de S3
```

---

## 🎯 Funciones en admin.ts que usan USE_PROXY_API

**Patrón actual:**
```typescript
if (api.USE_PROXY_API) {
  // Llamar a Lambda via API Gateway
} else {
  // Fallback: llamada directa a Supabase
}
```

### ✅ Funciones CON proxy implementado:

| Función | Endpoint Lambda | Estado |
|---------|----------------|--------|
| `getProductImages` | GET /products/{id} | ✅ Funciona |
| `checkSKUExists` | POST /products [action=check-sku] | ⚠️ Implementado pero router no rutea |
| `checkSlugExists` | POST /products [action=check-slug] | ⚠️ Implementado pero router no rutea |
| `generateProductSKU` | POST /products [action=generate-sku] | ⚠️ Implementado pero router no rutea |
| Upload images | POST /upload-url | ✅ Funciona (lambda-proxy-uploads) |

### ❌ Funciones SIN proxy (Supabase directo):

| Función | Operación | Tabla Supabase | Prioridad |
|---------|-----------|----------------|-----------|
| `createOpticalProduct` | INSERT | products | 🔴 Alta |
| `updateOpticalProduct` | UPDATE | products | 🔴 Alta |
| `deleteOpticalProduct` | DELETE | products + images | 🔴 Alta |
| `deactivateProduct` | UPDATE | products.is_active | 🟡 Media |
| `reactivateProduct` | UPDATE | products.is_active | 🟡 Media |
| `getAllOpticalProducts` | SELECT | products | 🟢 Baja (lectura) |
| `getAllOpticalProductsPaginated` | SELECT | products | 🟢 Baja (lectura) |
| `getAllCategories` | SELECT | product_categories | 🟢 Baja (lectura) |
| `getAllBrands` | SELECT | brands | 🟢 Baja (lectura) |
| **Usuarios (admin):** | | | |
| `getAllUsers` | SELECT | profiles | 🟡 Media |
| `getAllUsersPaginated` | SELECT | profiles | 🟡 Media |
| `createUser` | Lambda separada | Cognito + profiles | ✅ Ya tiene Lambda dedicada |
| `updateUser` | UPDATE | profiles | 🟡 Media |
| `deactivateUser` | UPDATE | profiles.is_active | 🟡 Media |
| **Órdenes (admin):** | | | |
| `getAllOrders` | SELECT | orders | 🟢 Baja |
| `getAllOrdersPaginated` | SELECT | orders | 🟢 Baja |
| `getUserOrders` | SELECT | orders | 🟢 Baja |

---

## 🔧 Plan de Acción - Migración Gradual

### Fase 1: Productos (Admin) - CRÍTICO ⚡

**Objetivo:** Migrar las 3 operaciones CRUD principales de productos a Lambda

1. **Activar routing en lambda-proxy:**
   - Modificar `handlers/router.js` para incluir rutas de productos admin
   - Agregar autenticación/autorización en router

2. **Implementar endpoints faltantes:**
   ```javascript
   POST /products - Crear producto (ya existe en products.js, falta routing)
   PUT /products/{id} - Actualizar producto (ya existe en products.js, falta routing)
   DELETE /products/{id} - Eliminar producto (ya existe en products.js, falta routing)
   ```

3. **Actualizar admin.ts:**
   - Activar `USE_PROXY_API` en createOpticalProduct
   - Activar `USE_PROXY_API` en updateOpticalProduct
   - Activar `USE_PROXY_API` en deleteOpticalProduct

**Archivos a modificar:**
- `packages/lambda-proxy/handlers/router.js` - Agregar rutas admin
- `apps/frontend/src/services/admin.ts` - Quitar fallbacks

---

### Fase 2: Usuarios (Admin) - MEDIO 🟡

**Objetivo:** Migrar gestión de usuarios excepto create (ya tiene Lambda)

1. **Crear handler `handlers/users.js`** con:
   ```javascript
   GET /users - getAllUsers
   GET /users?page=X&limit=Y - getAllUsersPaginated
   PUT /users/{id} - updateUser
   PUT /users/{id}/deactivate - deactivateUser
   ```

2. **Integrar en router.js**

3. **Actualizar admin.ts** para usar proxy

---

### Fase 3: Órdenes (Admin) - BAJA 🟢

**Objetivo:** Migrar consultas de órdenes (solo lectura por ahora)

1. **Crear handler `handlers/orders.js`** (o usar el existente)
2. **Implementar endpoints:**
   ```javascript
   GET /orders - getAllOrders
   GET /orders?page=X&limit=Y - getAllOrdersPaginated
   GET /orders/user/{userId} - getUserOrders
   ```

---

## 📊 Métricas de Migración

| Categoría | Total Funciones | Con Lambda | Sin Lambda | % Completado |
|-----------|----------------|------------|------------|--------------|
| **Productos** | 12 | 4 | 8 | 33% |
| **Usuarios** | 5 | 1* | 4 | 20% |
| **Órdenes** | 3 | 0 | 3 | 0% |
| **Public/Uploads** | 2 | 2 | 0 | ✅ 100% |
| **TOTAL** | 22 | 7 | 15 | **32%** |

*createUser usa Lambda dedicada de Cognito

---

## ⚠️ Problemas Detectados

1. **Código duplicado:** `lambda-proxy/handlers/products.js` tiene lógica completa pero `lambda-proxy-products/index.js` solo tiene GET básico
   - **Solución:** Consolidar en `lambda-proxy` y eliminar `lambda-proxy-products`

2. **Router incompleto:** `router.js` solo expone 4 endpoints pero hay 13 handlers disponibles
   - **Solución:** Agregar rutas para productos admin, check-sku, check-slug, generate-sku

3. **Sin autenticación en router:** Todos los endpoints son públicos actualmente
   - **Solución:** Validar JWT de Cognito en rutas admin

4. **Flag USE_PROXY_API desactivado:** Frontend está en `.env` con `VITE_USE_PROXY_API=false`
   - **Solución:** Activar cuando Fase 1 esté completa

---

## 🚀 Próximo Paso Recomendado

**ACCIÓN INMEDIATA:**
1. Modificar `packages/lambda-proxy/handlers/router.js` para agregar rutas de productos admin
2. Desplegar Lambda actualizada
3. Probar endpoints con Postman/Thunder Client
4. Activar USE_PROXY_API en `.env` para productos

**Comando para desplegar:**
```bash
cd infrastructure
pnpm cdk deploy --all
```

---

**Fecha de auditoría:** 2026-01-25  
**Estado general:** 32% migrado - Se requiere completar Fase 1 para operaciones críticas
