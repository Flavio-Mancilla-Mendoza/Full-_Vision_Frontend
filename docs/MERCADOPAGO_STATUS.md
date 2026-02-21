# MercadoPago Integration - Estado Actual

## ✅ Completado

### Backend (Lambda + API Gateway)
- **Lambda:** `full-vision-supabase-public-dev` maneja la creación de preferencias y webhooks
- **Rutas API Gateway:**
  - `POST /public/mercadopago/create-preference` → crea preferencia de pago en MP
  - `POST /public/mercadopago/webhook` → recibe notificaciones de MP
  - `POST /orders/checkout` → crea la orden con validación server-side de precios (ruta agregada explícitamente para evitar conflicto con `/orders/{id}`)
- **Variables de entorno Lambda configuradas:**
  - `MERCADOPAGO_ACCESS_TOKEN` = `APP_USR-7368029333645399-122915-2f4b1599fec371ff6cf7f9a7467a6a6b-3099839108`
  - `API_GATEWAY_URL` = `https://slrrvl1zs2.execute-api.sa-east-1.amazonaws.com/dev`
  - `FRONTEND_URL` = `https://full-vision-react.vercel.app`

### Frontend
- `src/services/mercadopago.ts` → servicio para crear preferencia MP vía API Gateway
- `src/pages/Checkout.tsx` → flujo completo: crear orden → crear preferencia MP → redirect a MP
- `src/pages/OrderConfirmation.tsx` → maneja retorno de MP (success/failure/pending), muestra estado de pago
- `src/hooks/useOrders.ts` → `useCreateOrder()` mutation con React Query

### Base de datos
- Columnas `payment_method`, `payment_status`, `transaction_id` agregadas a tabla `orders` (SQL en `database/add-payment-columns.sql`)
- Webhook URL configurada en panel de MP: `https://slrrvl1zs2.execute-api.sa-east-1.amazonaws.com/dev/public/mercadopago/webhook`

### Bug fix: Error 403 en checkout
- **Problema:** `POST /orders/checkout` daba 403 porque API Gateway lo matcheaba como `POST /orders/{id}` (id="checkout"), y esa ruta solo tenía GET/PUT
- **Fix:** Se agregó recurso explícito `/orders/checkout` con POST en CDK (`infrastructure/lib/api-gateway-stack.ts`) y se desplegó con `cdk deploy`

## 🔄 Pendiente: Probar el pago

### Error encontrado al probar
- Al completar el flujo de checkout y llegar a la pasarela de MP, aparece: **"Una de las partes con la que intentas hacer el pago es de prueba"**
- Esto ocurre porque MP detecta mezcla de entornos (test/producción)

### Cómo probar correctamente
El Access Token es el mismo para pruebas y producción en esta cuenta. Para probar:

1. Completar el flujo de checkout en https://full-vision-react.vercel.app
2. Cuando MP redirija a la pasarela de pago, **iniciar sesión con la cuenta de comprador de prueba:**
   - **Usuario:** `TESTUSER2300071973593236513`
   - **Contraseña:** `QsBefugz4Q`
   - **Código de verificación:** `839108`
3. Usar tarjetas de prueba:
   - Visa (aprobada): `4009 1753 3280 6176` — CVV: `123` — Venc: `11/25`
   - Mastercard (aprobada): `5031 7557 3453 0604` — CVV: `123` — Venc: `11/25`

### Después de probar exitosamente
- Verificar que la orden se actualice con `payment_status: 'approved'` en Supabase
- Verificar que el webhook de MP procese la notificación correctamente
- Verificar que `OrderConfirmation.tsx` muestre el estado correcto al retornar de MP

## Archivos clave

| Archivo | Descripción |
|---------|-------------|
| `src/services/mercadopago.ts` | Servicio frontend para crear preferencia |
| `src/pages/Checkout.tsx` | Flujo de checkout completo |
| `src/pages/OrderConfirmation.tsx` | Página de retorno post-pago |
| `src/hooks/useOrders.ts` | Mutation para crear orden |
| `infrastructure/lib/api-gateway-stack.ts` | Rutas API Gateway (incluye `/orders/checkout`) |
| `infrastructure/lambda/supabase-public/handlers/mercadopago.js` | Handler Lambda MP (preferencia + webhook) |
| `infrastructure/lambda/supabase-products/handlers/orders.js` | Handler Lambda checkout/orders |
| `database/add-payment-columns.sql` | Migración SQL para columnas de pago |
