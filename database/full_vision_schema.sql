-- Estructura de base de datos adaptada para Full Vision (Óptica)

-- Tabla de categorías específicas para óptica
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar categorías específicas de óptica
INSERT INTO product_categories (name, slug, description) VALUES
('Lentes Graduados', 'lentes-graduados', 'Lentes con graduación para corrección visual'),
('Lentes de Sol', 'lentes-sol', 'Lentes para protección solar'),
('Marcos', 'marcos', 'Marcos para lentes graduados'),
('Lentes de Contacto', 'lentes-contacto', 'Lentes de contacto blandos y rígidos'),
('Filtro Luz Azul', 'filtro-luz-azul', 'Lentes con filtro para luz azul'),
('Accesorios', 'accesorios', 'Estuches, limpiadores y accesorios');

-- Tabla de marcas
CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar marcas populares de óptica
INSERT INTO brands (name, slug, description) VALUES
('Ray-Ban', 'ray-ban', 'Marca icónica de lentes de sol'),
('Oakley', 'oakley', 'Lentes deportivos de alta calidad'),
('Full Vision', 'full-vision', 'Marca propia de la óptica'),
('Transitions', 'transitions', 'Lentes fotocromáticos'),
('Zeiss', 'zeiss', 'Lentes de alta precisión óptica');

-- Tabla de productos actualizada para óptica
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  slug VARCHAR(200) UNIQUE NOT NULL,
  sku VARCHAR(50) UNIQUE,
  
  -- Precios
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2),
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Relaciones
  category_id UUID REFERENCES product_categories(id),
  brand_id UUID REFERENCES brands(id),
  
  -- Inventario
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  
  -- Características específicas de lentes
  frame_material VARCHAR(100), -- 'acetato', 'metal', 'titanio', 'plastico'
  lens_type VARCHAR(100), -- 'graduado', 'solar', 'fotocromático', 'filtro-azul'
  frame_style VARCHAR(100), -- 'aviador', 'rectangular', 'redondo', 'cat-eye'
  frame_size VARCHAR(20), -- 'S', 'M', 'L', 'XL'
  lens_color VARCHAR(50),
  frame_color VARCHAR(50),
  gender VARCHAR(20), -- 'hombre', 'mujer', 'unisex', 'niño'
  
  -- Especificaciones técnicas
  bridge_width INTEGER, -- Ancho del puente en mm
  temple_length INTEGER, -- Largo de las patillas en mm
  lens_width INTEGER, -- Ancho del lente en mm
  
  -- Características especiales
  has_uv_protection BOOLEAN DEFAULT false,
  has_blue_filter BOOLEAN DEFAULT false,
  is_photochromic BOOLEAN DEFAULT false,
  has_anti_reflective BOOLEAN DEFAULT false,
  
  -- Imagen principal
  image_url TEXT,
  
  -- Metadatos
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  meta_title VARCHAR(200),
  meta_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de imágenes de productos
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  s3_key TEXT,
  alt_text VARCHAR(200),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes/ventas
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Estado de la orden
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  
  -- Totales
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Información de envío
  shipping_name VARCHAR(200),
  shipping_email VARCHAR(200),
  shipping_phone VARCHAR(50),
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  
  -- Información de facturación
  billing_name VARCHAR(200),
  billing_email VARCHAR(200),
  billing_address TEXT,
  billing_city VARCHAR(100),
  billing_postal_code VARCHAR(20),
  
  -- Fechas importantes
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipped_date TIMESTAMP WITH TIME ZONE,
  delivered_date TIMESTAMP WITH TIME ZONE,
  
  -- Notas
  customer_notes TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de órdenes
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Características específicas del item (graduación, etc.)
  prescription_details JSONB, -- Para almacenar graduación, etc.
  special_instructions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de carrito de compras
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  prescription_details JSONB,
  special_instructions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

-- Tabla de ubicaciones para exámenes (debe crearse ANTES que eye_exam_appointments)
CREATE TABLE IF NOT EXISTS eye_exam_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar ubicación por defecto
INSERT INTO eye_exam_locations (name, address, city, phone) VALUES
('Full Vision - Sucursal Principal', 'Dirección principal', 'Ciudad', '+1234567890')
ON CONFLICT DO NOTHING;

-- Tabla de perfiles de usuario (debe crearse ANTES que las políticas)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(200),
  full_name VARCHAR(200),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actualizar tabla de citas para exámenes oculares
CREATE TABLE IF NOT EXISTS eye_exam_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  location_id UUID REFERENCES eye_exam_locations(id),
  
  -- Información de la cita
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'
  
  -- Tipo de examen
  exam_type VARCHAR(100) DEFAULT 'comprehensive', -- 'comprehensive', 'basic', 'contact_lens', 'follow_up'
  
  -- Información del paciente
  patient_name VARCHAR(200) NOT NULL,
  patient_phone VARCHAR(50),
  patient_email VARCHAR(200),
  patient_age INTEGER,
  
  -- Motivo de la consulta
  reason_for_visit TEXT,
  has_insurance BOOLEAN DEFAULT false,
  insurance_provider VARCHAR(100),
  
  -- Historial médico relevante
  current_prescription TEXT,
  last_exam_date DATE,
  medical_conditions TEXT,
  medications TEXT,
  
  -- Resultados del examen (se llenan después)
  exam_results JSONB,
  prescription_issued JSONB,
  recommendations TEXT,
  
  -- Seguimiento
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Notas
  patient_notes TEXT,
  doctor_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON eye_exam_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON eye_exam_appointments(user_id);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON eye_exam_appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Políticas para productos (lectura pública, escritura solo admins)
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products are manageable by admins" ON products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Políticas para órdenes (usuarios ven solo las suyas, admins ven todas)
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Políticas para carrito (usuarios solo su carrito)
CREATE POLICY "Users can manage their own cart" ON cart_items FOR ALL USING (user_id = auth.uid());