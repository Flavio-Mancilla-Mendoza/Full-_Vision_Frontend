-- =============================================
-- Add payment columns to orders table
-- Required for MercadoPago webhook integration
-- =============================================
-- These columns are written by the MP webhook Lambda
-- when a payment notification arrives.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);

-- Optional: index on payment_status for admin queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
