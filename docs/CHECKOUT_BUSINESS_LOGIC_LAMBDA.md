# Lógica de Negocio del Checkout — Migrada a Lambda ✅

## Resumen

Se identificaron 3 vulnerabilidades de seguridad en el flujo de checkout donde lógica de negocio se ejecutaba en el frontend. **Las 3 han sido resueltas.**

---

## 1. ✅ RESUELTO — Email de confirmación ya no usa `anon key` desde el frontend

**Antes**: `src/hooks/useOrders.ts` llamaba a la Supabase Edge Function `send-order-confirmation` con `VITE_SUPABASE_ANON_KEY` desde el frontend, con precios del cliente.

**Ahora**: El Lambda `POST /orders/checkout` en `infrastructure/lambda/supabase-products/handlers/orders.js` envía el email server-side usando `SUPABASE_SERVICE_ROLE_KEY`. Los precios vienen de la BD, no del frontend.

---

## 2. ✅ RESUELTO — MercadoPago ya no recibe precios del frontend

**Antes**: El frontend enviaba `items` con precios a `/mercadopago/create-preference`.

**Ahora**: El frontend solo envía `{ orderId }`. El Lambda en `infrastructure/lambda/supabase-public/index.js` consulta `order_items` + `products` en la BD para obtener precios verificados.

---

## 3. ✅ RESUELTO — Cálculo de precios es server-side

**Antes**: `src/services/admin/orders.ts` (`createOrderFromCart`) calculaba subtotal, IGV y shipping en el frontend.

**Ahora**: `POST /orders/checkout` (Lambda) hace todo server-side:
1. Recibe solo `{ items: [{ product_id, quantity }], shippingInfo, paymentMethod }`
2. Consulta precios reales con `validateAndCalculateOrderItems()`
3. Calcula subtotal, IGV (18%), shipping (gratis > S/300)
4. Crea orden + order_items con precios verificados
5. Desactiva productos, limpia carrito
6. Envía email de confirmación

---

## Archivos modificados

### Backend (Lambda)
- `infrastructure/lambda/supabase-products/handlers/orders.js` — Nuevo endpoint `POST /orders/checkout` con `handleCheckout()` + `sendConfirmationEmail()`
- `infrastructure/lambda/supabase-products/handlers/router.js` — Ruta `/orders/checkout` pasa `normalizedRequest` al handler
- `infrastructure/lambda/supabase-public/index.js` — `create-preference` solo acepta `orderId`, consulta precios de la BD

### Frontend
- `src/hooks/useOrders.ts` — `useCreateOrder` llama `POST /orders/checkout` via API Gateway, ya no envía email
- `src/services/mercadopago.ts` — `CreatePreferenceRequest` solo requiere `orderId` + `payer`
- `src/pages/Checkout.tsx` — Ya no construye `items[]` con precios para MP

### Nota de deploy
Las variables de entorno del Lambda necesitan `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para el envío de emails server-side.
