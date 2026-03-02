-- ============================================
-- CHECK CONSTRAINTS para validación de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================
-- Estas constraints aseguran que solo valores válidos 
-- se inserten/actualicen en las columnas de status y role.
-- Equivale a tener enums pero con mayor flexibilidad para futuros cambios.

-- ============================================
-- 1. orders.status
-- ============================================
-- Primero eliminar si ya existe (para poder re-ejecutar sin error)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending', 
  'confirmed', 
  'processing', 
  'shipped', 
  'delivered', 
  'cancelled', 
  'ready_for_pickup'
));

-- ============================================
-- 2. eye_exam_appointments.status
-- ============================================
ALTER TABLE eye_exam_appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE eye_exam_appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN (
  'scheduled', 
  'confirmed', 
  'in_progress', 
  'completed', 
  'cancelled'
));

-- ============================================
-- 3. profiles.role
-- ============================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin', 
  'customer'
));

-- ============================================
-- 4. orders.payment_status
-- ============================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IS NULL OR payment_status IN (
  'approved', 
  'pending', 
  'rejected', 
  'refunded', 
  'cancelled', 
  'in_process'
));

-- ============================================
-- 5. orders.payment_method
-- ============================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IS NULL OR payment_method IN (
  'credit_card', 
  'debit_card', 
  'mercadopago', 
  'cash', 
  'transfer'
));

-- ============================================
-- 6. eye_exam_appointments.exam_type
-- ============================================
ALTER TABLE eye_exam_appointments DROP CONSTRAINT IF EXISTS appointments_exam_type_check;

ALTER TABLE eye_exam_appointments 
ADD CONSTRAINT appointments_exam_type_check 
CHECK (exam_type IS NULL OR exam_type IN (
  'comprehensive', 
  'basic', 
  'contact_lens', 
  'follow_up',
  'routine'
));

-- ============================================
-- 7. site_content.content_type
-- ============================================
ALTER TABLE site_content DROP CONSTRAINT IF EXISTS site_content_type_check;

ALTER TABLE site_content 
ADD CONSTRAINT site_content_type_check 
CHECK (content_type IN (
  'image', 
  'text', 
  'video'
));

-- ============================================
-- Verificación: listar constraints creados
-- ============================================
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_name IN ('orders', 'eye_exam_appointments', 'profiles', 'site_content')
ORDER BY tc.table_name;
