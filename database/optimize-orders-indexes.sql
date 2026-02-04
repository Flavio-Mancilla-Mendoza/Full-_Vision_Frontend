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

-- Índice para órdenes por rango de fechas
CREATE INDEX IF NOT EXISTS idx_orders_date_range ON orders(created_at) WHERE created_at > NOW() - INTERVAL '1 year';

-- Verificar índices creados
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