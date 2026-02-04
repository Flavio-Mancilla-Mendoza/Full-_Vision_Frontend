-- ================================================================
-- TABLA PARA GESTIÓN DE CONTENIDO DEL SITIO
-- ================================================================

-- Tabla para configuración del sitio y contenido dinámico
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section VARCHAR(50) NOT NULL, -- 'hero', 'about', 'banner', etc.
  content_type VARCHAR(20) NOT NULL, -- 'image', 'text', 'video'
  key VARCHAR(100) NOT NULL, -- 'hero_background', 'hero_title', 'banner_promo'
  value TEXT, -- URL, texto, o contenido
  alt_text TEXT, -- Para imágenes
  metadata JSONB, -- Datos adicionales (dimensiones, SEO, etc.)
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(section, key)
);

-- ================================================================
-- TRIGGERS PARA AUTO-UPDATE DE TIMESTAMPS
-- ================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_site_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS update_site_content_timestamp ON site_content;
CREATE TRIGGER update_site_content_timestamp
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_site_content_timestamp();

-- ================================================================
-- INSERTAR CONTENIDO INICIAL DEL HERO
-- ================================================================

INSERT INTO site_content (section, content_type, key, value, alt_text, metadata) VALUES
(
  'hero', 
  'image', 
  'hero_background', 
  'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  'Lentes de alta calidad - Full Vision',
  '{"width": 2070, "height": 750, "quality": 90, "priority": true}'
),
(
  'hero', 
  'text', 
  'hero_title', 
  'Especialistas en Salud Visual',
  null,
  '{"font_size": "large", "color": "white"}'
),
(
  'hero', 
  'text', 
  'hero_subtitle', 
  'Descubre nuestra exclusiva colección de lentes diseñados para tu estilo y comodidad',
  null,
  '{"font_size": "medium", "color": "white"}'
),
(
  'banner', 
  'image', 
  'promo_banner', 
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
  'Promoción especial en monturas seleccionadas',
  '{"width": 1200, "height": 400, "quality": 80}'
)
ON CONFLICT (section, key) DO UPDATE SET
  value = EXCLUDED.value,
  alt_text = EXCLUDED.alt_text,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ================================================================
-- STORAGE BUCKET PARA CONTENIDO DEL SITIO
-- ================================================================

-- Crear bucket de storage para contenido del sitio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-content', 
  'site-content', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================================

-- Habilitar RLS en la tabla
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Site content is viewable by everyone" ON site_content;
DROP POLICY IF EXISTS "Admins can manage site content" ON site_content;

-- ⭐ POLÍTICA 1: Público puede leer contenido activo
CREATE POLICY "Site content is viewable by everyone" ON site_content
FOR SELECT USING (is_active = true);

-- ⭐ POLÍTICA 2: Solo admins pueden gestionar contenido (usando tabla profiles)
CREATE POLICY "Admins can manage site content" ON site_content
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ================================================================
-- STORAGE POLICIES PARA SITE-CONTENT BUCKET
-- ================================================================

-- Eliminar políticas de storage existentes si existen
DROP POLICY IF EXISTS "Public read access for site content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload site content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete site content" ON storage.objects;

-- Lectura pública de archivos
CREATE POLICY "Public read access for site content" ON storage.objects
FOR SELECT USING (bucket_id = 'site-content');

-- Solo admins pueden subir archivos
CREATE POLICY "Admins can upload site content" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'site-content' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Solo admins pueden actualizar archivos
CREATE POLICY "Admins can update site content" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'site-content' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Solo admins pueden eliminar archivos
CREATE POLICY "Admins can delete site content" ON storage.objects
FOR DELETE USING (
  bucket_id = 'site-content' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ================================================================
-- VERIFICACIÓN Y VALIDACIÓN
-- ================================================================

-- Función para verificar que la tabla se creó correctamente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_content') THEN
    RAISE NOTICE 'Tabla site_content creada correctamente';
  ELSE
    RAISE EXCEPTION 'Error: No se pudo crear la tabla site_content';
  END IF;
END $$;