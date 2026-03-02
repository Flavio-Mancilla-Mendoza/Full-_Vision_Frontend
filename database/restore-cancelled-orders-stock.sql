-- ============================================================
-- RESTAURAR STOCK DE PEDIDOS CANCELADOS (ejecución única)
-- ============================================================
-- Este script restaura el stock de productos que fue decrementado
-- por pedidos que luego fueron cancelados (antes del fix de stock).
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

-- 1. Primero ver qué se va a restaurar (DRY RUN - solo consulta)
SELECT
    o.id AS order_id,
    o.order_number,
    o.status,
    o.created_at,
    oi.product_id,
    p.name AS product_name,
    oi.quantity AS qty_to_restore,
    p.stock_quantity AS current_stock,
    (COALESCE(p.stock_quantity, 0) + oi.quantity) AS new_stock,
    p.is_active
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'cancelled'
ORDER BY o.created_at DESC;

-- 2. Restaurar stock sumando las cantidades de los pedidos cancelados
-- IMPORTANTE: Descomentar y ejecutar después de verificar el paso 1
/*
WITH cancelled_items AS (
    SELECT
        oi.product_id,
        SUM(oi.quantity) AS total_qty_to_restore
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'cancelled'
      AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id
)
UPDATE products p
SET
    stock_quantity = COALESCE(p.stock_quantity, 0) + ci.total_qty_to_restore,
    is_active = true,
    updated_at = NOW()
FROM cancelled_items ci
WHERE p.id = ci.product_id;
*/
