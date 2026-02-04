-- Agregar campo customer_dni a la tabla orders para pedidos de retiro en tienda
-- Este campo almacenará el DNI del cliente cuando elija recoger en tienda

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_dni VARCHAR(8);

-- Agregar comentario al campo para documentación
COMMENT ON COLUMN orders.customer_dni IS 'DNI del cliente para retiro en tienda (8 dígitos)';
