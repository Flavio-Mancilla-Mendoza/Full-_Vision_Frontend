# Estado "Listo para Recojo" (ready_for_pickup)

## Descripción

Nuevo estado agregado al sistema de pedidos para identificar órdenes que están listas para ser recogidas en tienda física.

## Cuándo usar este estado

- El pedido ha sido procesado y verificado
- Los productos están empacados y listos
- El cliente eligió "Recoger en Tienda" como método de entrega
- El pedido está esperando que el cliente lo retire

## Flujo típico para pedidos con retiro en tienda

### Para Envío a Domicilio:

```
pending → confirmed → processing → shipped → delivered
```

### Para Retiro en Tienda:

```
pending → confirmed → processing → ready_for_pickup → delivered
```

## Implementación

### 1. Migración de Base de Datos

Ejecutar el archivo: `add-ready-for-pickup-status.sql`

```bash
# Conectarse a Supabase y ejecutar:
psql -U postgres -d postgres -f database/add-ready-for-pickup-status.sql
```

O desde el SQL Editor de Supabase, copiar y ejecutar el contenido del archivo.

### 2. Cambios en el Frontend

#### Tipos actualizados:

- `src/types/index.ts` - OrderStatus ahora incluye `"ready_for_pickup"`

#### Componentes actualizados:

- `src/components/admin/OrderManagement.tsx`:

  - Agregado contador de pedidos listos para recojo
  - Agregado badge "Listo para Recojo" (verde)
  - Agregado filtro en el dropdown
  - Agregado opción en el selector de cambio de estado

- `src/pages/MisPedidos.tsx`:
  - Agregado badge visible para clientes
  - Ícono: ShoppingBag (bolsa de compras)
  - Color: Verde (`text-green-600`)

## Visualización

### Para Administradores:

- **Tarjeta de estadística**: "Listo Recojo" (verde) en el dashboard
- **Badge**: "Listo para Recojo" en color azul (default)
- **Filtro**: Disponible en el dropdown de filtros
- **Selector**: Opción para cambiar pedido a este estado

### Para Clientes:

- **Badge**: "Listo para Recojo" en color azul (default)
- **Ícono**: 🛍️ (ShoppingBag)
- **Mensaje**: El cliente puede ver cuando su pedido está listo para recoger

## Notificaciones Recomendadas (Futuro)

Cuando un pedido cambie a `ready_for_pickup`, se podría:

1. Enviar email al cliente notificándole
2. Enviar SMS con el código de retiro
3. Mostrar la dirección de la tienda y horarios
4. Recordar traer DNI para el retiro

## Consultas SQL Útiles

### Ver todos los pedidos listos para recojo:

```sql
SELECT
  order_number,
  shipping_name,
  shipping_email,
  shipping_phone,
  customer_dni,
  total_amount,
  created_at,
  updated_at
FROM orders
WHERE status = 'ready_for_pickup'
ORDER BY updated_at DESC;
```

### Estadísticas por estado:

```sql
SELECT
  status,
  COUNT(*) as cantidad,
  SUM(total_amount) as total_ventas
FROM orders
GROUP BY status
ORDER BY cantidad DESC;
```

### Pedidos antiguos listos para recojo (más de 7 días):

```sql
SELECT
  order_number,
  shipping_name,
  shipping_phone,
  updated_at,
  AGE(NOW(), updated_at) as tiempo_esperando
FROM orders
WHERE status = 'ready_for_pickup'
  AND updated_at < NOW() - INTERVAL '7 days'
ORDER BY updated_at ASC;
```

## Mejoras Futuras

1. **Sistema de notificaciones**: Alertar automáticamente al cliente
2. **Tiempo límite**: Definir cuántos días puede estar en este estado
3. **Código de retiro**: Generar código único para cada pedido
4. **Verificación de DNI**: Sistema de validación en el retiro
5. **Integración con WhatsApp**: Notificar por WhatsApp cuando esté listo
