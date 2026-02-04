# 🧪 Testing Guide - API Gateway Migration

## Pre-requisitos

1. **Infraestructura desplegada** ✅

   - API Gateway: `https://slrrvl1zs2.execute-api.sa-east-1.amazonaws.com/dev/`
   - Lambda Proxy: `full-vision-supabase-proxy-dev`
   - Cognito configurado

2. **Variable de entorno configurada** ✅

   ```bash
   VITE_API_GATEWAY_URL=https://slrrvl1zs2.execute-api.sa-east-1.amazonaws.com/dev
   ```

3. **Servicios y Hooks creados** ✅
   - `/src/services/products.ts`
   - `/src/services/orders.ts`
   - `/src/services/profile.ts`
   - `/src/hooks/useProducts.ts`
   - `/src/hooks/useProfile.ts`
   - `/src/hooks/useOrders.ts` (actualizado)

## 🚀 Paso 1: Iniciar el servidor de desarrollo

```bash
npm run dev
```

El servidor debería iniciar en `http://localhost:8080` (o el puerto configurado).

## 🔐 Paso 2: Test de Autenticación

### 2.1 Login con Cognito

1. Abre el navegador en `http://localhost:8080/login`
2. Inicia sesión con credenciales de Cognito:
   - Usuario admin: `flavio_mancillamendoza@outlook.es`
   - O crea un nuevo usuario

### 2.2 Verificar JWT Token

Abre **DevTools Console** y ejecuta:

```javascript
// Verificar que Amplify está configurado
import { fetchAuthSession } from "aws-amplify/auth";

const session = await fetchAuthSession();
console.log("JWT Token:", session.tokens?.idToken?.toString());
console.log("User Groups:", session.tokens?.accessToken?.payload["cognito:groups"]);
```

**Resultado esperado:**

- Token JWT largo (eyJ...)
- Groups: `['admin']` o `[]` (usuario regular)

## 📦 Paso 3: Test de Productos

### 3.1 Listar Productos (GET /products)

En una página que use productos, abre DevTools > Network:

```javascript
// En la consola del navegador
import { getProducts } from "./src/services/products";

const products = await getProducts();
console.log("Productos:", products);
```

**Verificar en Network Tab:**

- Request URL: `https://slrrvl1zs2.execute-api.sa-east-1.amazonaws.com/dev/products`
- Method: `GET`
- Status: `200 OK`
- Headers: `Authorization: Bearer eyJ...`

**Resultado esperado:**

```json
[
  {
    "id": "uuid",
    "name": "Lentes Ray-Ban",
    "base_price": 15000,
    "sale_price": 12000,
    "stock_quantity": 50,
    "is_active": true,
    ...
  }
]
```

### 3.2 Ver Producto Individual (GET /products/:id)

```javascript
const product = await getProduct("product-id-here");
console.log("Producto:", product);
```

**Verificar:**

- Request: `GET /products/{id}`
- Status: `200 OK`
- Producto específico retornado

### 3.3 Crear Producto (POST /products) - Solo Admin

```javascript
// Solo funcionará si estás autenticado como admin
import { createProduct } from "./src/services/products";

const newProduct = await createProduct({
  name: "Test Product",
  base_price: 10000,
  stock_quantity: 10,
  category_id: "category-id",
  brand_id: "brand-id",
  is_active: true,
});
console.log("Producto creado:", newProduct);
```

**Verificar:**

- Request: `POST /products`
- Status: `201 Created` o `200 OK`
- Producto creado con ID

**Si no eres admin:**

- Status: `403 Forbidden`
- Error: "Unauthorized: Admin access required"

### 3.4 Actualizar Producto (PUT /products/:id) - Solo Admin

```javascript
const updated = await updateProduct("product-id", {
  base_price: 15000,
});
console.log("Producto actualizado:", updated);
```

**Verificar:**

- Request: `PUT /products/{id}`
- Status: `200 OK`
- Producto actualizado

### 3.5 Eliminar Producto (DELETE /products/:id) - Solo Admin

```javascript
const result = await deleteProduct("product-id");
console.log("Resultado:", result);
```

**Verificar:**

- Request: `DELETE /products/{id}`
- Status: `200 OK`
- Mensaje de éxito

## 📋 Paso 4: Test de Órdenes

### 4.1 Listar Órdenes (GET /orders)

```javascript
import { getOrders } from "./src/services/orders";

const orders = await getOrders();
console.log("Órdenes:", orders);
```

**Resultado esperado:**

- **Usuario regular**: Solo sus propias órdenes
- **Admin**: Todas las órdenes del sistema

**Verificar en Lambda Logs (CloudWatch):**

```
User ID: user-123
User Groups: []
Filtering orders by user ID
```

### 4.2 Ver Orden Individual (GET /orders/:id)

```javascript
const order = await getOrder("order-id");
console.log("Orden:", order);
```

**Verificar permisos:**

- Usuario puede ver solo sus órdenes
- Admin puede ver cualquier orden
- Intentar ver orden de otro usuario → `403 Forbidden`

### 4.3 Crear Orden (POST /orders)

```javascript
import { createOrder } from "./src/services/orders";

const newOrder = await createOrder({
  items: [{ product_id: "product-id", quantity: 2 }],
  shipping_address: "...",
  total_amount: 30000,
});
console.log("Orden creada:", newOrder);
```

### 4.4 Actualizar Orden (PUT /orders/:id)

```javascript
const updated = await updateOrder("order-id", {
  status: "shipped",
});
console.log("Orden actualizada:", updated);
```

**Verificar permisos:**

- Usuario puede actualizar solo sus órdenes
- Admin puede actualizar cualquier orden

## 👤 Paso 5: Test de Perfil

### 5.1 Obtener Perfil (GET /profile)

```javascript
import { getProfile } from "./src/services/profile";

const profile = await getProfile();
console.log("Mi perfil:", profile);
```

**Resultado esperado:**

```json
{
  "id": "user-cognito-id",
  "email": "user@example.com",
  "full_name": "...",
  "role": "admin" | "user",
  "phone": "...",
  "address": {...}
}
```

### 5.2 Actualizar Perfil (PUT /profile)

```javascript
const updated = await updateProfile({
  phone: "+5491123456789",
  full_name: "Juan Pérez",
});
console.log("Perfil actualizado:", updated);
```

## 🔍 Paso 6: Monitoreo y Debugging

### 6.1 Ver Logs del Lambda (CloudWatch)

1. Ir a AWS Console → CloudWatch → Log Groups
2. Buscar: `/aws/lambda/full-vision-supabase-proxy-dev`
3. Ver logs en tiempo real

**Logs esperados:**

```
START RequestId: abc-123
Event: {
  "httpMethod": "GET",
  "path": "/products",
  "headers": { "Authorization": "Bearer eyJ..." }
}
User from Cognito: { "sub": "user-id", "email": "..." }
User Groups: ["admin"]
Response: 200
END RequestId: abc-123
```

### 6.2 Métricas de API Gateway

1. AWS Console → API Gateway → `FullVisionAPI`
2. Dashboard → Ver métricas:
   - Count (número de requests)
   - Latency (tiempo de respuesta)
   - 4XX/5XX errors
   - Integration Latency

### 6.3 Debug en el Navegador

**DevTools > Network:**

- Filtrar por: `slrrvl1zs2.execute-api`
- Ver cada request:
  - Request Headers (debe incluir `Authorization: Bearer ...`)
  - Response
  - Timing

**DevTools > Console:**

```javascript
// Activar logs detallados
localStorage.setItem("debug", "api:*");

// Ver todos los requests del api.ts
// Los logs deberían aparecer automáticamente
```

## ❌ Troubleshooting

### Error: 401 Unauthorized

**Causa:** Token JWT inválido o expirado

**Solución:**

```javascript
// Forzar refresh del token
import { signOut } from "aws-amplify/auth";
await signOut();
// Volver a hacer login
```

### Error: 403 Forbidden

**Causa:** Sin permisos para la acción

**Verificar:**

- ¿Necesitas ser admin?
- ¿Intentas acceder a recursos de otro usuario?

### Error: 500 Internal Server Error

**Causa:** Error en Lambda o Supabase

**Verificar:**

1. CloudWatch Logs del Lambda
2. Supabase logs
3. Variable `SUPABASE_SERVICE_ROLE_KEY` configurada

### Error: CORS

**Síntoma:** `Access-Control-Allow-Origin` error

**Solución:** Verificar en API Gateway que CORS está habilitado

### Productos no se cargan

**Verificar:**

1. Variable `VITE_API_GATEWAY_URL` en `.env`
2. Reiniciar servidor de dev: `npm run dev`
3. Hard refresh del navegador: `Ctrl+Shift+R`

## ✅ Checklist Final

- [ ] Login exitoso con Cognito
- [ ] JWT token visible en console
- [ ] GET /products retorna lista de productos
- [ ] GET /products/:id retorna producto específico
- [ ] POST /products funciona (admin) o rechaza (user)
- [ ] PUT /products/:id funciona (admin)
- [ ] DELETE /products/:id funciona (admin)
- [ ] GET /orders retorna órdenes (filtradas por usuario)
- [ ] GET /orders/:id respeta permisos
- [ ] POST /orders crea orden
- [ ] PUT /orders/:id respeta permisos
- [ ] GET /profile retorna datos del usuario
- [ ] PUT /profile actualiza perfil
- [ ] Logs visibles en CloudWatch
- [ ] Métricas visibles en API Gateway Dashboard

## 📊 Métricas de Éxito

**Performance:**

- Latencia promedio < 500ms
- 99% de requests exitosos (2xx)
- 0% de errores 5xx

**Seguridad:**

- Todos los endpoints requieren autenticación
- Permisos validados correctamente
- Admin vs User separados

**Funcionalidad:**

- CRUD completo de productos funciona
- Órdenes filtradas por usuario
- Perfil actualizable

## 🎉 Próximo Paso

Una vez validado todo, migrar componentes específicos del frontend:

1. ProductList → usar `useProducts()`
2. ProductDetail → usar `useProduct(id)`
3. OrdersList → usar `useUserOrders()`
4. ProfilePage → usar `useProfile()`
