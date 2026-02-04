-- Script de archivado de órdenes antiguas - Full Vision
-- Archivar órdenes completadas/canceladas con más de 2 años de antigüedad

-- 1. Crear tablas de archivo (si no existen)
CREATE TABLE IF NOT EXISTS orders_archived (
  LIKE orders INCLUDING ALL
);

CREATE TABLE IF NOT EXISTS order_items_archived (
  LIKE order_items INCLUDING ALL
);

-- 2. Función para archivar órdenes antiguas
CREATE OR REPLACE FUNCTION archive_old_orders(months_old INTEGER DEFAULT 24)
RETURNS TABLE(orders_archived_count INTEGER, items_archived_count INTEGER) AS $$
DECLARE
  cutoff_date TIMESTAMP WITH TIME ZONE;
  orders_count INTEGER := 0;
  items_count INTEGER := 0;
BEGIN
  -- Calcular fecha límite
  cutoff_date := NOW() - INTERVAL '1 month' * months_old;

  RAISE NOTICE 'Archivando órdenes anteriores a: %', cutoff_date;

  -- Contar órdenes a archivar
  SELECT COUNT(*) INTO orders_count
  FROM orders
  WHERE created_at < cutoff_date
  AND status IN ('delivered', 'cancelled');

  RAISE NOTICE 'Órdenes a archivar: %', orders_count;

  IF orders_count = 0 THEN
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;

  -- Archivar items de órdenes primero
  INSERT INTO order_items_archived
  SELECT oi.* FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at < cutoff_date
  AND o.status IN ('delivered', 'cancelled');

  GET DIAGNOSTICS items_count = ROW_COUNT;
  RAISE NOTICE 'Items archivados: %', items_count;

  -- Archivar órdenes
  INSERT INTO orders_archived
  SELECT * FROM orders
  WHERE created_at < cutoff_date
  AND status IN ('delivered', 'cancelled');

  -- Verificar que se archivaron las mismas órdenes
  IF orders_count <> (SELECT COUNT(*) FROM orders_archived WHERE created_at < cutoff_date) THEN
    RAISE EXCEPTION 'Error: Número de órdenes archivadas no coincide';
  END IF;

  -- Eliminar items de órdenes principales
  DELETE FROM order_items
  WHERE order_id IN (
    SELECT id FROM orders
    WHERE created_at < cutoff_date
    AND status IN ('delivered', 'cancelled')
  );

  -- Eliminar órdenes principales
  DELETE FROM orders
  WHERE created_at < cutoff_date
  AND status IN ('delivered', 'cancelled');

  RAISE NOTICE 'Archivado completado exitosamente';

  RETURN QUERY SELECT orders_count, items_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Ejecutar archivado (descomentar para ejecutar)
-- SELECT * FROM archive_old_orders(24); -- 24 meses = 2 años

-- 4. Verificar resultados
-- SELECT
--   'orders' as table_name,
--   COUNT(*) as active_count
-- FROM orders
-- UNION ALL
-- SELECT
--   'orders_archived' as table_name,
--   COUNT(*) as archived_count
-- FROM orders_archived
-- UNION ALL
-- SELECT
--   'order_items' as table_name,
--   COUNT(*) as active_count
-- FROM order_items
-- UNION ALL
-- SELECT
--   'order_items_archived' as table_name,
--   COUNT(*) as archived_count
-- FROM order_items_archived;

-- 5. Programar archivado automático (ejecutar mensualmente)
-- Esto debería configurarse como un cron job en Supabase o similar
-- SELECT cron.schedule(
--   'archive-old-orders',
--   '0 2 1 * *', -- 1ro de cada mes a las 2 AM
--   'SELECT archive_old_orders(24);'
-- );