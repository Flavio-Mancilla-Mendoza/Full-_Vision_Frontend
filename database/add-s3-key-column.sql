-- Agregar columna s3_key a product_images
-- Esta columna almacena la ruta/key del archivo en el storage (S3 o Supabase Storage)
-- Ejecutar en Supabase SQL Editor

-- Agregar la columna s3_key si no existe
ALTER TABLE product_images 
ADD COLUMN IF NOT EXISTS s3_key TEXT;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'product_images'
ORDER BY ordinal_position;

-- Opcional: Agregar índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_product_images_s3_key 
ON product_images(s3_key);

-- Verificar las columnas finales
\d product_images
