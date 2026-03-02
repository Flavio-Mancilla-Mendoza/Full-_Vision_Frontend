# Mejoras Pendientes — Full Vision

## Prioridad Alta (impacto directo en ventas)

### 1. Paginación server-side de órdenes
- **Problema**: `getAllOrdersPaginated` descarga TODAS las órdenes y filtra/pagina client-side — no escala.
- **Solución**: Implementar `LIMIT`, `OFFSET` y filtros en el Lambda (`GET /orders?page=1&limit=50&status=pending`).
- **Archivos**: `infrastructure/lambda/supabase-products/handlers/orders.js`, `src/services/admin/orders.ts`

### 2. Notificaciones por WhatsApp/email al cambiar estado
- **Problema**: El cliente no recibe notificación cuando su pedido avanza (confirmado → enviado → entregado).
- **Solución**: Enviar email/WhatsApp automático desde el Lambda al actualizar estado en `PUT /orders/:id`.
- **Archivos**: `infrastructure/lambda/supabase-products/handlers/orders.js` (case PUT)

### 3. Retry de pago desde "Mis Pedidos"
- **Problema**: Si el pago falla, el usuario solo puede reintentar desde checkout — no desde su historial.
- **Solución**: Botón "Reintentar pago" en la página de Mis Pedidos para órdenes con status `pending`.
- **Archivos**: `src/pages/MisPedidos.tsx`, `src/services/mercadopago.ts`

---

## Prioridad Media (experiencia de usuario)

### 4. Reserva temporal de stock
- **Problema**: Dos usuarios pueden iniciar checkout del mismo producto y solo uno pagará exitosamente.
- **Solución**: Al crear la orden, reservar stock por 15 min. Un cron/scheduled Lambda libera reservas expiradas.
- **Archivos**: Nuevo campo `reserved_until` en `order_items` o tabla `stock_reservations`

### 5. Dashboard con métricas reales
- **Problema**: El endpoint `GET /admin/dashboard` tiene `ordersByStatus: []` hardcodeado.
- **Solución**: Conectar con el nuevo endpoint `GET /orders/counts` y agregar métricas de revenue por período.
- **Archivos**: `infrastructure/lambda/supabase-products/handlers/dashboard.js`, `src/components/admin/Dashboard.tsx`

### 6. Búsqueda full-text de productos
- **Problema**: La búsqueda actual filtra client-side — no escala con muchos productos.
- **Solución**: Usar PostgreSQL full-text search (`tsvector`) o integrar Algolia/Meilisearch.
- **Archivos**: `infrastructure/lambda/supabase-products/handlers/products.js`, componentes de búsqueda

---

## Prioridad Baja (robustez técnica)

### 7. Tests E2E para flujo de pago
- **Problema**: El flujo crítico (checkout → webhook → stock) no tiene tests automatizados.
- **Solución**: Tests con Playwright/Cypress para el frontend + tests unitarios para los Lambdas.
- **Archivos**: Nuevo directorio `test/`

### 8. Rate limiting en API Gateway
- **Problema**: Los endpoints no tienen protección contra abuso (fuerza bruta, scraping).
- **Solución**: Configurar throttling en API Gateway (CDK) + WAF rules.
- **Archivos**: `infrastructure/lib/api-gateway-stack.ts`

### 9. Idempotencia en webhook de MercadoPago
- **Problema**: Si MercadoPago envía el mismo webhook dos veces, el stock podría decrementarse/restaurarse doble.
- **Solución**: Guardar `transaction_id` procesados y verificar antes de ejecutar lógica de stock.
- **Archivos**: `infrastructure/lambda/supabase-public/index.js` (webhook handler)
