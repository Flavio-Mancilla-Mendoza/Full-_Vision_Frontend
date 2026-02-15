# Despliegue Pendiente

## 1. ✅ Dashboard Admin → API Gateway (DESPLEGADO - 12 Feb 2026)

Se migró `getDashboardStats()` de consultas directas a Supabase a un endpoint Lambda.

### Cambios realizados

- **Frontend**: `src/services/admin/dashboard.ts` → ahora llama a `GET /admin/dashboard/stats` con JWT de Cognito
- **Lambda handler**: `infrastructure/lambda/supabase-products/handlers/dashboard.js` (NUEVO)
- **Router**: `infrastructure/lambda/supabase-products/handlers/router.js` → ruta `/admin/dashboard` agregada

### Estado del deploy

- ✅ Lambda `full-vision-supabase-products-dev` desplegada (12 Feb 2026, nodejs20.x, Active)
- ✅ Ruta `/admin/dashboard` responde correctamente (401 sin auth = esperado)
- ✅ Frontend ya apunta a API Gateway
- ⏳ Pendiente: probar end-to-end con usuario Admin logueado en Cognito

---

## 2. ✅ Servicios Admin migrados a API Gateway (verificado 14 Feb 2026)

Todos los servicios en `src/services/admin/` ya están migrados a API Gateway + Lambda. Ninguno usa Supabase directo desde el frontend.

| Servicio | Archivo | Estado |
|----------|---------|--------|
| Usuarios | `admin/users.ts` | ✅ Usa `adminProfilesApi` + API Gateway |
| Productos | `admin/products.ts` | ✅ Usa `productsApi`, `brandsApi`, `categoriesApi` |
| Órdenes | `admin/orders.ts` | ✅ Usa `ordersApi` + API Gateway |
| Locales | `admin/locations.ts` | ✅ Usa `locationsApi` + API Gateway |
| Citas | `admin/appointments.ts` | ✅ Usa `appointmentsApi` + API Gateway |
| Imágenes | `admin/images.ts` | ✅ Usa `productImagesApi` + presigned URLs |
| Featured | `admin/featured.ts` | ✅ Usa `productsApi`, `ordersApi` |
| Helpers | `admin/helpers.ts` | ✅ Utilidades (Cognito auth, no Supabase) |

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
