-- =====================================================
-- Level 1: Optimización de filtros con SQL
-- Reemplaza procesamiento JavaScript por agregaciones SQL
-- =====================================================

-- 1. Índice compuesto para filtros por género (el más importante)
CREATE INDEX IF NOT EXISTS idx_products_gender_active
ON products(gender, is_active)
WHERE is_active = true;

-- 2. Índice para descuentos activos
CREATE INDEX IF NOT EXISTS idx_products_discount_active
ON products(gender, discount_percentage)
WHERE is_active = true AND discount_percentage > 0;

-- 3. Índice para rango de precios
CREATE INDEX IF NOT EXISTS idx_products_price_active
ON products(gender, base_price)
WHERE is_active = true;

-- =====================================================
-- Función: get_filter_brands
-- Retorna marcas con conteo de productos por género
-- =====================================================
CREATE OR REPLACE FUNCTION get_filter_brands(p_gender text)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  product_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name::text,
    b.slug::text,
    COUNT(p.id) as product_count
  FROM brands b
  INNER JOIN products p ON p.brand_id = b.id
  WHERE p.is_active = true
    AND p.gender = p_gender
  GROUP BY b.id, b.name, b.slug
  ORDER BY b.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Función: get_filter_discounts
-- Retorna porcentajes de descuento únicos por género
-- =====================================================
CREATE OR REPLACE FUNCTION get_filter_discounts(p_gender text)
RETURNS TABLE(
  discount_value numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.discount_percentage as discount_value
  FROM products p
  WHERE p.is_active = true
    AND p.gender = p_gender
    AND p.discount_percentage > 0
  ORDER BY p.discount_percentage;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Función: get_filter_price_range
-- Retorna min y max de precios por género
-- =====================================================
CREATE OR REPLACE FUNCTION get_filter_price_range(p_gender text)
RETURNS TABLE(
  min_price numeric,
  max_price numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(MIN(p.base_price), 0) as min_price,
    COALESCE(MAX(p.base_price), 1000) as max_price
  FROM products p
  WHERE p.is_active = true
    AND p.gender = p_gender;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Verificación: probar las funciones
-- =====================================================
-- SELECT * FROM get_filter_brands('hombre');
-- SELECT * FROM get_filter_discounts('hombre');
-- SELECT * FROM get_filter_price_range('hombre');
