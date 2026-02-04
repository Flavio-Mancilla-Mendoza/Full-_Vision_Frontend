-- Agregar el nuevo estado 'ready_for_pickup' al sistema de órdenes
-- Este estado es para pedidos listos para recoger en tienda
-- Compatible con columnas TEXT/VARCHAR (no requiere ENUM)

-- Verificar la estructura actual de la tabla orders
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'status';

-- Agregar o actualizar el constraint de check para incluir el nuevo estado
-- Primero, eliminar el constraint existente si existe
DO $$ 
BEGIN
    -- Intentar eliminar el constraint existente
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'orders' 
        AND constraint_name = 'orders_status_check'
    ) THEN
        ALTER TABLE orders DROP CONSTRAINT orders_status_check;
        RAISE NOTICE 'Constraint anterior eliminado';
    END IF;
    
    -- Agregar el nuevo constraint con todos los estados permitidos
    ALTER TABLE orders 
    ADD CONSTRAINT orders_status_check 
    CHECK (status IN (
        'pending', 
        'confirmed', 
        'processing', 
        'ready_for_pickup', 
        'shipped', 
        'delivered', 
        'cancelled'
    ));
    
    RAISE NOTICE 'Nuevo constraint agregado exitosamente con ready_for_pickup';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error: %. El estado se agregará sin constraint.', SQLERRM;
END $$;

-- Agregar comentario a la columna
COMMENT ON COLUMN orders.status IS 'Estados permitidos: pending, confirmed, processing, ready_for_pickup (listo para recojo), shipped, delivered, cancelled';

-- Verificar que no hay órdenes con estados inválidos
SELECT status, COUNT(*) as cantidad
FROM orders
GROUP BY status
ORDER BY cantidad DESC;
