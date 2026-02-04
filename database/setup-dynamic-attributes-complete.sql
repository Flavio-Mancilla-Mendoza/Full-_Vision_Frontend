-- =====================================================
-- SETUP COMPLETO: Sistema de Atributos Dinámicos
-- =====================================================
-- Este script configura TODO el sistema de atributos dinámicos desde cero
-- Ejecuta cada sección en orden

-- =====================================================
-- PASO 0: Limpiar tablas antiguas si existen
-- =====================================================
-- Esto elimina las tablas con estructura antigua para crear las nuevas
DROP TABLE IF EXISTS product_attributes CASCADE;
DROP TABLE IF EXISTS attribute_values CASCADE;
DROP TABLE IF EXISTS attribute_types CASCADE;

-- =====================================================
-- PASO 1: Crear las tablas con estructura correcta
-- =====================================================

-- Tabla de tipos de atributos
CREATE TABLE attribute_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_filterable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de valores de atributos
CREATE TABLE attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_type_id UUID REFERENCES attribute_types(id) ON DELETE CASCADE,
  value VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7), -- Para colores, ej: #FF0000
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attribute_type_id, value)
);

-- Tabla de relación productos-atributos
CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  attribute_value_id UUID REFERENCES attribute_values(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, attribute_value_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_attribute_values_type ON attribute_values(attribute_type_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_product ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_value ON product_attributes(attribute_value_id);

-- =====================================================
-- PASO 2: Insertar tipos de atributos
-- =====================================================

INSERT INTO attribute_types (slug, display_name, description, is_filterable, sort_order) VALUES
('frame_size', 'Talla', 'Tamaño del marco (S, M, L, XL)', true, 1),
('frame_material', 'Material del Marco', 'Material de fabricación del marco', true, 2),
('frame_color', 'Color del Marco', 'Color principal del marco', true, 3),
('lens_type', 'Tipo de Lente', 'Tipo de lente (polarizado, espejado, etc)', true, 4),
('lens_color', 'Color de Lente', 'Color de los lentes', true, 5)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_filterable = EXCLUDED.is_filterable,
  sort_order = EXCLUDED.sort_order;

-- =====================================================
-- PASO 3: Insertar valores para cada tipo de atributo
-- =====================================================

-- Tallas (frame_size)
INSERT INTO attribute_values (attribute_type_id, value, display_name, sort_order)
SELECT id, 's', 'S', 1 FROM attribute_types WHERE slug = 'frame_size'
UNION ALL
SELECT id, 'm', 'M', 2 FROM attribute_types WHERE slug = 'frame_size'
UNION ALL
SELECT id, 'l', 'L', 3 FROM attribute_types WHERE slug = 'frame_size'
UNION ALL
SELECT id, 'xl', 'XL', 4 FROM attribute_types WHERE slug = 'frame_size'
ON CONFLICT (attribute_type_id, value) DO NOTHING;

-- Materiales (frame_material)
INSERT INTO attribute_values (attribute_type_id, value, display_name, sort_order)
SELECT id, 'metal', 'Metal', 1 FROM attribute_types WHERE slug = 'frame_material'
UNION ALL
SELECT id, 'acetato', 'Acetato', 2 FROM attribute_types WHERE slug = 'frame_material'
UNION ALL
SELECT id, 'policarbonato', 'Policarbonato', 3 FROM attribute_types WHERE slug = 'frame_material'
UNION ALL
SELECT id, 'titanio', 'Titanio', 4 FROM attribute_types WHERE slug = 'frame_material'
UNION ALL
SELECT id, 'plastico', 'Plástico', 5 FROM attribute_types WHERE slug = 'frame_material'
ON CONFLICT (attribute_type_id, value) DO NOTHING;

-- Colores de Marco (frame_color)
INSERT INTO attribute_values (attribute_type_id, value, display_name, color_hex, sort_order)
SELECT id, 'negro', 'Negro', '#000000', 1 FROM attribute_types WHERE slug = 'frame_color'
UNION ALL
SELECT id, 'marron', 'Marrón', '#8B4513', 2 FROM attribute_types WHERE slug = 'frame_color'
UNION ALL
SELECT id, 'azul', 'Azul', '#0000FF', 3 FROM attribute_types WHERE slug = 'frame_color'
UNION ALL
SELECT id, 'gris', 'Gris', '#808080', 4 FROM attribute_types WHERE slug = 'frame_color'
UNION ALL
SELECT id, 'dorado', 'Dorado', '#FFD700', 5 FROM attribute_types WHERE slug = 'frame_color'
UNION ALL
SELECT id, 'plateado', 'Plateado', '#C0C0C0', 6 FROM attribute_types WHERE slug = 'frame_color'
UNION ALL
SELECT id, 'rojo', 'Rojo', '#FF0000', 7 FROM attribute_types WHERE slug = 'frame_color'
UNION ALL
SELECT id, 'verde', 'Verde', '#008000', 8 FROM attribute_types WHERE slug = 'frame_color'
ON CONFLICT (attribute_type_id, value) DO NOTHING;

-- Tipos de Lente (lens_type)
INSERT INTO attribute_values (attribute_type_id, value, display_name, sort_order)
SELECT id, 'polarizado', 'Polarizado', 1 FROM attribute_types WHERE slug = 'lens_type'
UNION ALL
SELECT id, 'espejado', 'Espejado', 2 FROM attribute_types WHERE slug = 'lens_type'
UNION ALL
SELECT id, 'degradado', 'Degradado', 3 FROM attribute_types WHERE slug = 'lens_type'
UNION ALL
SELECT id, 'fotocromatico', 'Fotocromático', 4 FROM attribute_types WHERE slug = 'lens_type'
UNION ALL
SELECT id, 'uv400', 'UV400', 5 FROM attribute_types WHERE slug = 'lens_type'
ON CONFLICT (attribute_type_id, value) DO NOTHING;

-- Colores de Lente (lens_color)
INSERT INTO attribute_values (attribute_type_id, value, display_name, color_hex, sort_order)
SELECT id, 'negro', 'Negro', '#000000', 1 FROM attribute_types WHERE slug = 'lens_color'
UNION ALL
SELECT id, 'marron', 'Marrón', '#8B4513', 2 FROM attribute_types WHERE slug = 'lens_color'
UNION ALL
SELECT id, 'gris', 'Gris', '#808080', 3 FROM attribute_types WHERE slug = 'lens_color'
UNION ALL
SELECT id, 'verde', 'Verde', '#008000', 4 FROM attribute_types WHERE slug = 'lens_color'
UNION ALL
SELECT id, 'azul', 'Azul', '#0000FF', 5 FROM attribute_types WHERE slug = 'lens_color'
UNION ALL
SELECT id, 'espejado_plata', 'Espejado Plata', '#C0C0C0', 6 FROM attribute_types WHERE slug = 'lens_color'
UNION ALL
SELECT id, 'espejado_dorado', 'Espejado Dorado', '#FFD700', 7 FROM attribute_types WHERE slug = 'lens_color'
ON CONFLICT (attribute_type_id, value) DO NOTHING;

-- =====================================================
-- PASO 4: Verificar que todo se creó correctamente
-- =====================================================

SELECT 
  at.display_name as tipo_atributo,
  COUNT(av.id) as valores_disponibles,
  STRING_AGG(av.display_name, ', ' ORDER BY av.sort_order) as valores
FROM attribute_types at
LEFT JOIN attribute_values av ON av.attribute_type_id = at.id
WHERE at.is_active = true
GROUP BY at.display_name, at.sort_order
ORDER BY at.sort_order;

-- =====================================================
-- PASO 5: Ahora ejecuta migrate-products-to-attributes.sql
-- =====================================================

-- Después de verificar que todo está OK arriba, ejecuta:
-- 1. Primero la sección 3 de migrate-products-to-attributes.sql (identificar valores faltantes)
-- 2. Si hay valores faltantes, agrégalos usando la sección 4
-- 3. Ejecuta la sección 1 (migración propiamente)
-- 4. Ejecuta la sección 2 (verificación)

-- ✅ Setup completo
