# Despliegue Pendiente

## 1. Dashboard Admin → API Gateway (LISTO para deploy)

Se migró `getDashboardStats()` de consultas directas a Supabase a un endpoint Lambda.

### Cambios realizados

- **Frontend**: `src/services/admin/dashboard.ts` → ahora llama a `GET /admin/dashboard/stats` con JWT de Cognito
- **Lambda handler**: `infrastructure/lambda/supabase-products/handlers/dashboard.js` (NUEVO)
- **Router**: `infrastructure/lambda/supabase-products/handlers/router.js` → ruta `/admin/dashboard` agregada

### Pasos para desplegar

1. **Desplegar el Lambda actualizado**:
   ```bash
   cd infrastructure
   npx cdk deploy FullVisionStack
   ```
   O si se despliega manualmente, comprimir el contenido de `lambda/supabase-products/` y subir a AWS Lambda.

2. **Verificar variable de entorno**: `VITE_API_GATEWAY_URL` debe apuntar al API Gateway correcto donde está desplegado `supabase-products`.

3. **Probar**: Iniciar sesión con un usuario del grupo `Admins` en Cognito y verificar que el dashboard carga las estadísticas.

---

## 2. Servicios Admin pendientes de migración

Los siguientes servicios en `src/services/admin/` aún hacen consultas directas a Supabase con `anon key` desde el frontend. Deben migrarse al patrón Lambda + API Gateway como se hizo con dashboard:

| Servicio | Archivo | Descripción |
|----------|---------|-------------|
| Usuarios | `admin/users.ts` | CRUD de usuarios admin |
| Productos | `admin/products.ts` | Gestión de productos |
| Órdenes | `admin/orders.ts` | Gestión de pedidos |
| Locales | `admin/locations.ts` | Locales y sucursales |
| Citas | `admin/appointments.ts` | Citas de examen visual |
| Imágenes | `admin/images.ts` | Upload de imágenes |
| Featured | `admin/featured.ts` | Productos destacados |
| Helpers | `admin/helpers.ts` | Utilidades compartidas (auth token) |

### Prioridad sugerida
1. `orders.ts` — datos sensibles de pedidos
2. `users.ts` — datos de usuarios
3. `products.ts` — ya existe proxy parcial en `supabase-products`
4. El resto en orden de criticidad

---

## 3. Checkout — Refactoring completado

`src/pages/Checkout.tsx` fue modularizado de **738 líneas a ~170 líneas**.

### Componentes creados en `src/components/checkout/`

| Componente | Responsabilidad |
|-----------|----------------|
| `StepIndicator.tsx` | Indicador de progreso (3 pasos) |
| `ShippingForm.tsx` | Formulario de envío/retiro + contacto |
| `PaymentMethodSelector.tsx` | Selector de método de pago |
| `OrderConfirmStep.tsx` | Revisión y confirmación |
| `OrderSidebar.tsx` | Resumen del carrito + precios |
| `types.ts` | Tipos, constantes y validación |
| `index.ts` | Barrel exports |
