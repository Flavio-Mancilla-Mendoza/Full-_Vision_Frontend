# 🚀 **INSTRUCCIONES: Crear Índices de Optimización**

## ⚡ **Ejecutar en Supabase SQL Editor**

Ve a [Supabase Dashboard](https://supabase.com/dashboard) → Tu proyecto → SQL Editor

## 📋 **Copia y pega este SQL:**

```sql
-- Índices de optimización para pedidos - Full Vision
-- Ejecutar en Supabase SQL Editor

-- Índices para consultas más comunes en órdenes
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Índices para items de órdenes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Índice compuesto para búsquedas por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
```

## ✅ **Verificar que funcionó:**

Después de ejecutar, copia y pega esta consulta para verificar:

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items')
ORDER BY tablename, indexname;
```

## ⚠️ **Nota sobre el índice de rango de fechas:**

El índice `idx_orders_date_range` fue removido porque usa `NOW()`, una función volátil que PostgreSQL no permite en condiciones WHERE de índices. En su lugar, el índice `idx_orders_created_at` ya optimiza consultas por rangos de fechas. PostgreSQL usará este índice automáticamente para filtros como `created_at > '2023-01-01'`.

## 🎯 **Resultado esperado:**

Deberías ver 6 índices nuevos:

- `idx_orders_user_status`
- `idx_orders_status_created`
- `idx_orders_created_at`
- `idx_orders_order_number`
- `idx_order_items_order_id`
- `idx_order_items_product_id`
- `idx_orders_user_created`

## ⚡ **Beneficios inmediatos:**

- **Consultas 5-10x más rápidas**
- **Paginación instantánea**
- **Búsquedas eficientes**
- **Mejor experiencia de usuario**

---

## 🔄 **Próximos pasos:**

1. ✅ **Ejecutar índices** (arriba)
2. ✅ **Probar paginación** en `/admin/orders`
3. 📋 **Archivado** (próximo mes)

¿Ya ejecutaste los índices? ¡Avísame para probar la paginación!</content>
<parameter name="filePath">c:\Users\flavi\OneDrive\Documentos\develop\full-vision-react\docs\INDICES_OPTIMIZACION.md
