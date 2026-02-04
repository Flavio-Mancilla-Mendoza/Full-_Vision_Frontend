-- Monitoreo de rendimiento de pedidos - Full Vision
-- Ejecutar en Supabase SQL Editor para diagnosticar problemas de rendimiento

-- 1. Consultas más lentas relacionadas con pedidos
SELECT
    query,
    calls,
    total_time / 1000 as total_seconds,
    mean_time / 1000 as mean_seconds,
    rows
FROM pg_stat_statements
WHERE query ILIKE '%orders%'
   OR query ILIKE '%order_items%'
ORDER BY mean_time DESC
LIMIT 10;

-- 2. Tamaño de tablas de pedidos
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items', 'orders_archived', 'order_items_archived')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Estadísticas de uso de índices
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items')
ORDER BY idx_scan DESC;

-- 4. Órdenes por estado (distribución actual)
SELECT
    status,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 5. Órdenes por mes (últimos 12 meses)
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as orders_count,
    SUM(total_amount) as total_revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 6. Rendimiento de consultas recientes (última hora)
SELECT
    pid,
    usename,
    client_addr,
    query_start,
    state,
    LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE query ILIKE '%orders%'
  AND state = 'active'
  AND query_start > NOW() - INTERVAL '1 hour'
ORDER BY query_start DESC;

-- 7. Verificar si hay bloqueos en tablas de pedidos
SELECT
    blocked_locks.pid as blocked_pid,
    blocked_activity.usename as blocked_user,
    blocking_locks.pid as blocking_pid,
    blocking_activity.usename as blocking_user,
    blocked_activity.query as blocked_query
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE blocked_locks.relation IN (
    SELECT oid FROM pg_class
    WHERE relname IN ('orders', 'order_items')
);