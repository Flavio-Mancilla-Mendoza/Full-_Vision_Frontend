-- Agregar columna address a la tabla profiles
-- Ejecutar este script en Supabase SQL Editor

-- Verificar si la columna ya existe antes de agregarla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN address TEXT;
        
        RAISE NOTICE 'Columna address agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna address ya existe';
    END IF;
END $$;

-- Comentario para documentación
COMMENT ON COLUMN public.profiles.address IS 'Dirección completa del usuario';
