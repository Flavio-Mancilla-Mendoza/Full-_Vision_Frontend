-- ===================================
-- SISTEMA DE CITAS - COMPATIBLE CON ESQUEMAS EXISTENTES
-- Compatible con: full_vision_schema.sql, hybrid-schema.sql, setup-supabase-security.sql
-- ===================================

-- 📍 VERIFICAR Y ACTUALIZAR TABLA DE UBICACIONES
-- La tabla ya existe en full_vision_schema.sql, pero vamos a asegurar compatibilidad
DO $$ 
BEGIN
  -- Agregar columnas faltantes si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'eye_exam_locations' AND column_name = 'lat'
  ) THEN
    ALTER TABLE eye_exam_locations ADD COLUMN lat DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'eye_exam_locations' AND column_name = 'lng'
  ) THEN
    ALTER TABLE eye_exam_locations ADD COLUMN lng DECIMAL(11, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'eye_exam_locations' AND column_name = 'email'
  ) THEN
    ALTER TABLE eye_exam_locations ADD COLUMN email VARCHAR(200);
  END IF;
END $$;

-- 🩺 CREAR/ACTUALIZAR TABLA DE CITAS COMPATIBLE
-- Verificar si la tabla existe y tiene la estructura correcta
DO $$
BEGIN
  -- Si la tabla no existe, crearla
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'eye_exam_appointments'
  ) THEN
    
    CREATE TABLE eye_exam_appointments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      location_id UUID REFERENCES eye_exam_locations(id) ON DELETE RESTRICT,
      
      -- Información básica de la cita (compatible con API simple)
      scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
      notes TEXT,
      
      -- Información del paciente (para API simplificada)
      patient_name VARCHAR(200),
      patient_phone VARCHAR(50),
      patient_email VARCHAR(200),
      
      -- Metadatos
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
  ELSE
    -- Si la tabla existe, agregar columnas faltantes para compatibilidad
    
    -- Agregar scheduled_at si no existe (para API simple)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'eye_exam_appointments' AND column_name = 'scheduled_at'
    ) THEN
      ALTER TABLE eye_exam_appointments ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
      
      -- Si existe appointment_date y appointment_time, combinarlos
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eye_exam_appointments' AND column_name = 'appointment_date'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eye_exam_appointments' AND column_name = 'appointment_time'
      ) THEN
        UPDATE eye_exam_appointments 
        SET scheduled_at = (appointment_date + appointment_time)::TIMESTAMP WITH TIME ZONE
        WHERE scheduled_at IS NULL;
      END IF;
    END IF;

    -- Agregar columnas de paciente si no existen
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'eye_exam_appointments' AND column_name = 'patient_name'
    ) THEN
      ALTER TABLE eye_exam_appointments ADD COLUMN patient_name VARCHAR(200);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'eye_exam_appointments' AND column_name = 'patient_phone'
    ) THEN
      ALTER TABLE eye_exam_appointments ADD COLUMN patient_phone VARCHAR(50);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'eye_exam_appointments' AND column_name = 'patient_email'
    ) THEN
      ALTER TABLE eye_exam_appointments ADD COLUMN patient_email VARCHAR(200);
    END IF;

  END IF;
END $$;

-- 🏢 INSERTAR UBICACIÓN POR DEFECTO (mejorada y más completa)
INSERT INTO eye_exam_locations (name, address, city, phone, email, lat, lng, is_active)
SELECT 
    'Full Vision - Sucursal Principal',
    'Av. Principal 123, Miraflores',
    'Lima',
    '(01) 234-5678',
    'citas@fullvision.com',
    -12.1191,
    -77.0286,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM eye_exam_locations 
    WHERE name = 'Full Vision - Sucursal Principal'
);

-- ===================================
-- POLÍTICAS RLS COMPATIBLES CON ESQUEMAS EXISTENTES
-- ===================================

-- Habilitar RLS si no está habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'eye_exam_locations' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE eye_exam_locations ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'eye_exam_appointments' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE eye_exam_appointments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 📍 POLÍTICAS PARA UBICACIONES
-- Eliminar políticas existentes si existen para evitar conflictos
DROP POLICY IF EXISTS "Anyone can view active locations" ON eye_exam_locations;
DROP POLICY IF EXISTS "Eye exam locations are viewable by everyone" ON eye_exam_locations;
DROP POLICY IF EXISTS "Public read access for locations" ON eye_exam_locations;
DROP POLICY IF EXISTS "Only admins can modify locations" ON eye_exam_locations;
DROP POLICY IF EXISTS "Admins can manage locations" ON eye_exam_locations;

-- Política: Lectura pública de ubicaciones activas (compatible con todos los esquemas)
CREATE POLICY "Public read access for eye_exam_locations" ON eye_exam_locations
    FOR SELECT USING (is_active = true);

-- Política: Solo admins pueden modificar ubicaciones (compatible con hybrid y full_vision)
CREATE POLICY "Admins can manage eye_exam_locations" ON eye_exam_locations
    FOR ALL USING (
        -- Compatible con sistema de profiles
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR
        -- Compatible con sistema directo de email (hybrid-schema)
        (auth.jwt() ->> 'email') = 'flaviomancilla@gmail.com'
        OR
        -- Fallback para cualquier usuario autenticado con rol admin en JWT
        (auth.jwt() ->> 'role') = 'admin'
    );

-- 🩺 POLÍTICAS PARA CITAS
-- Eliminar políticas existentes si existen para evitar conflictos
DROP POLICY IF EXISTS "Users can view own appointments" ON eye_exam_appointments;
DROP POLICY IF EXISTS "Users can create own appointments" ON eye_exam_appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON eye_exam_appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON eye_exam_appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON eye_exam_appointments;
DROP POLICY IF EXISTS "Admins can modify all appointments" ON eye_exam_appointments;
DROP POLICY IF EXISTS "Admins can manage appointments" ON eye_exam_appointments;

-- Política: Los usuarios pueden ver sus propias citas
CREATE POLICY "Users can view own appointments" ON eye_exam_appointments
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios pueden crear sus propias citas
CREATE POLICY "Users can insert own appointments" ON eye_exam_appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias citas
CREATE POLICY "Users can update own appointments" ON eye_exam_appointments
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Solo admins pueden ver todas las citas (compatible con todos los esquemas)
CREATE POLICY "Admins can view all appointments" ON eye_exam_appointments
    FOR SELECT USING (
        -- Compatible con sistema de profiles
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR
        -- Compatible con sistema directo de email (hybrid-schema)
        (auth.jwt() ->> 'email') = 'flaviomancilla@gmail.com'
        OR
        -- Fallback para cualquier usuario autenticado con rol admin en JWT
        (auth.jwt() ->> 'role') = 'admin'
    );

-- Política: Solo admins pueden modificar cualquier cita
CREATE POLICY "Admins can manage all appointments" ON eye_exam_appointments
    FOR ALL USING (
        -- Compatible con sistema de profiles
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR
        -- Compatible con sistema directo de email (hybrid-schema)
        (auth.jwt() ->> 'email') = 'flaviomancilla@gmail.com'
        OR
        -- Fallback para cualquier usuario autenticado con rol admin en JWT
        (auth.jwt() ->> 'role') = 'admin'
    );

-- ===================================
-- ÍNDICES PARA PERFORMANCE (compatibles)
-- ===================================

-- Crear índices solo si no existen
DO $$
BEGIN
  -- Índices para eye_exam_appointments
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_eye_exam_appointments_user_id') THEN
    CREATE INDEX idx_eye_exam_appointments_user_id ON eye_exam_appointments(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_eye_exam_appointments_location_id') THEN
    CREATE INDEX idx_eye_exam_appointments_location_id ON eye_exam_appointments(location_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_eye_exam_appointments_scheduled_at') THEN
    CREATE INDEX idx_eye_exam_appointments_scheduled_at ON eye_exam_appointments(scheduled_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_eye_exam_appointments_status') THEN
    CREATE INDEX idx_eye_exam_appointments_status ON eye_exam_appointments(status);
  END IF;

  -- Índices para eye_exam_locations
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_eye_exam_locations_active') THEN
    CREATE INDEX idx_eye_exam_locations_active ON eye_exam_locations(is_active) WHERE is_active = true;
  END IF;
END $$;

-- ===================================
-- TRIGGERS PARA UPDATED_AT (compatible con esquemas existentes)
-- ===================================

-- Función update_updated_at_column ya existe en full_vision_schema, pero verificamos
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers solo si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_eye_exam_appointments_updated_at'
  ) THEN
    CREATE TRIGGER update_eye_exam_appointments_updated_at 
    BEFORE UPDATE ON eye_exam_appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_eye_exam_locations_updated_at'
  ) THEN
    CREATE TRIGGER update_eye_exam_locations_updated_at 
    BEFORE UPDATE ON eye_exam_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ===================================
-- VERIFICACIÓN FINAL Y REPORTE
-- ===================================

-- Mostrar estado de las tablas de citas
SELECT 
  'eye_exam_locations' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_active = true) as active_records
FROM eye_exam_locations
UNION ALL
SELECT 
  'eye_exam_appointments' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_appointments
FROM eye_exam_appointments;

-- Verificar RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('eye_exam_locations', 'eye_exam_appointments')
ORDER BY tablename;