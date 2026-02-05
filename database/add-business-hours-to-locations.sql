-- Agregar columna business_hours a eye_exam_locations
-- Esta columna almacena el horario de atención de cada ubicación

ALTER TABLE eye_exam_locations
ADD COLUMN IF NOT EXISTS business_hours TEXT DEFAULT '09:00-18:00';

-- Comentario descriptivo
COMMENT ON COLUMN eye_exam_locations.business_hours IS 'Horario de atención de la ubicación en formato HH:MM-HH:MM';

-- Actualizar updated_at para registros existentes (opcional)
UPDATE eye_exam_locations 
SET updated_at = NOW() 
WHERE business_hours IS NULL;
