/*
  # Add billing amount fields to clients table
  
  1. Changes
    - Add initial_fee field for first payment
    - Add monthly_fee field for recurring payments
*/

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS initial_fee decimal(10,2),
ADD COLUMN IF NOT EXISTS monthly_fee decimal(10,2);

-- Update any existing clients to have the same value for both fees
UPDATE clients 
SET initial_fee = 0, monthly_fee = 0 
WHERE initial_fee IS NULL OR monthly_fee IS NULL;