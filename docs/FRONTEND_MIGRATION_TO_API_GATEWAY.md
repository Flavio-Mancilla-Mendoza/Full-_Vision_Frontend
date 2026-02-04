# Migración Frontend: Supabase → API Gateway

## 🎯 Objetivo

Migrar las llamadas directas a Supabase del frontend para usar el API Gateway + Lambda Proxy, solucionando la incompatibilidad entre Cognito Auth y Supabase Auth.

## 📋 Estado Actual

### ✅ Completado

1. **Infraestructura desplegada**
   - API Gateway: `https://slrrvl1zs2.execute-api.sa-east-1.amazonaws.com/dev/`
   - Lambda Proxy: `full-vision-supabase-proxy-dev`
   - Cognito Authorizer configurado

2. **Variable de entorno configurada**

   ```bash
   VITE_API_GATEWAY_URL=https://slrrvl1zs2.execute-api.sa-east-1.amazonaws.com/dev
   ```

3. **Servicio API creado**
   - `/src/services/api.ts` con interfaces TypeScript
   - Métodos para products, orders, profile

### ⏳ Pendiente

## 🔄 Pasos de Migración

### 1. Identificar Servicios que Usan Supabase

Buscar en el código todos los archivos que importan `supabase`:

```bash
# Buscar importaciones de Supabase
grep -r "from.*supabase" src/
grep -r "supabase\\.from" src/
```

Archivos típicos a migrar:

- `/src/services/products.ts` - CRUD de productos
- `/src/services/orders.ts` - Gestión de pedidos
- `/src/services/profile.ts` - Perfil de usuario
- `/src/hooks/useProducts.ts` - Hook de productos
- `/src/hooks/useOrders.ts` - Hook de pedidos

### 2. Reemplazar Llamadas Directas

**ANTES (Supabase directo):**

```typescript
import { supabase } from "../lib/supabaseClient";

export async function getProducts() {
  const { data, error } = await supabase.from("products").select("*");

  if (error) throw error;
  return data;
}
```

**DESPUÉS (API Gateway):**

```typescript
import { productsApi } from "./api";

export async function getProducts() {
  return await productsApi.list();
}
```

### 3. Actualizar Servicios Principales

#### Products Service

```typescript
// src/services/products.ts
import { productsApi, Product } from "./api";

export const getProducts = () => productsApi.list();
export const getProduct = (id: string) => productsApi.get(id);
export const createProduct = (data: Partial<Product>) => productsApi.create(data);
export const updateProduct = (id: string, data: Partial<Product>) => productsApi.update(id, data);
export const deleteProduct = (id: string) => productsApi.delete(id);
```

#### Orders Service

```typescript
// src/services/orders.ts
import { ordersApi, Order } from "./api";

export const getOrders = () => ordersApi.list();
export const getOrder = (id: string) => ordersApi.get(id);
export const createOrder = (data: Partial<Order>) => ordersApi.create(data);
export const updateOrder = (id: string, data: Partial<Order>) => ordersApi.update(id, data);
```

#### Profile Service

```typescript
// src/services/profile.ts
import { profileApi, Profile } from "./api";

export const getProfile = () => profileApi.get();
export const updateProfile = (data: Partial<Profile>) => profileApi.update(data);
```

### 4. Actualizar Hooks

#### useProducts Hook

```typescript
// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../services/api";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list(),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
```

### 5. Testing

#### Test Manual

1. **Login**

   ```
   - Abrir http://localhost:8080
   - Iniciar sesión con usuario Cognito
   - Verificar que se obtiene JWT token
   ```

2. **Listar Productos**

   ```
   - Navegar a /productos
   - Verificar que se cargan desde API Gateway
   - Abrir DevTools > Network
   - Verificar request a: slrrvl1zs2.execute-api.sa-east-1.amazonaws.com
   ```

3. **Crear/Editar Producto (Admin)**

   ```
   - Login como admin
   - Crear nuevo producto
   - Verificar que se guarda en Supabase
   - Verificar que aparece en la lista
   ```

4. **Ver Perfil**
   ```
   - Ir a /perfil
   - Verificar datos del usuario
   - Actualizar datos
   - Verificar que se guardan
   ```

#### Test con DevTools

```javascript
// Consola del navegador
// Verificar que api.ts está funcionando
import { productsApi } from "./services/api";

// Esto debería llamar a API Gateway
const products = await productsApi.list();
console.log(products);
```

### 6. Manejo de Errores

El servicio API ya incluye manejo de errores:

```typescript
// Errores automáticamente capturados:
// - 401: Token inválido o expirado → Redirect a /login
// - 403: Sin permisos → Mostrar mensaje
// - 404: Recurso no encontrado
// - 500: Error del servidor
```

### 7. Validación de Permisos

El Lambda Proxy valida permisos automáticamente:

```typescript
// Admin permissions (Lambda)
if (userGroups.includes("admin")) {
  // Puede: GET, POST, PUT, DELETE
}

// Regular user permissions
if (!userGroups.includes("admin")) {
  // Puede: GET (solo sus datos)
  // No puede: POST, PUT, DELETE de otros usuarios
}
```

## 🔍 Checklist de Migración

- [ ] Identificar todos los servicios que usan Supabase
- [ ] Migrar `/src/services/products.ts` → `productsApi`
- [ ] Migrar `/src/services/orders.ts` → `ordersApi`
- [ ] Migrar `/src/services/profile.ts` → `profileApi`
- [ ] Actualizar hooks de React Query
- [ ] Remover imports de `supabaseClient` (excepto para auth legacy)
- [ ] Test de login + JWT token
- [ ] Test CRUD de productos
- [ ] Test CRUD de órdenes
- [ ] Test perfil de usuario
- [ ] Test permisos admin vs user
- [ ] Validar manejo de errores
- [ ] Actualizar documentación

## 🚨 Importante

### NO Migrar (todavía)

- **Auth**: Cognito Auth se maneja con Amplify, no cambiar
- **Storage**: S3 uploads siguen usando AWS SDK
- **Realtime**: Si usas Supabase Realtime, dejarlo por ahora

### Rollback Plan

Si hay problemas, puedes volver temporalmente a Supabase directo:

```typescript
// .env
VITE_USE_DIRECT_SUPABASE = true;

// api.ts
const USE_SUPABASE = import.meta.env.VITE_USE_DIRECT_SUPABASE === "true";

if (USE_SUPABASE) {
  // Usar supabase directo
} else {
  // Usar API Gateway
}
```

## 📚 Referencias

- [API Gateway Stack](../infrastructure/lib/api-gateway-stack.ts)
- [Lambda Proxy](../packages/lambda-proxy/index.js)
- [API Service](../src/services/api.ts)
- [Auth Migration](./AUTH_MIGRATION_COGNITO.md)

## 🎉 Próximos Pasos

Una vez completada la migración:

1. Monitorear CloudWatch Logs del Lambda
2. Revisar métricas de API Gateway
3. Optimizar consultas pesadas
4. Implementar caché (Redis o API Gateway caching)
5. Agregar más endpoints según necesidad
