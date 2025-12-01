-- Multi-Day Order System Migration
-- Run this in your Supabase SQL Editor to add multi-day order support

-- Add order_type column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'single' CHECK (order_type IN ('single', 'multi'));

-- Add unique constraint to prevent duplicate orders for same customer on same date
-- Drop existing constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS unique_customer_date_order;

-- Create unique constraint on customer_id and date
CREATE UNIQUE INDEX IF NOT EXISTS unique_customer_date_order ON orders(customer_id, date);

-- Add comment for documentation
COMMENT ON COLUMN orders.order_type IS 'Type of order: single (one day) or multi (multiple days subscription)';
