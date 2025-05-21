/*
  # Add payment reference fields
  
  1. New Fields
    - Add reference_month field for tracking which month was paid
    - Add paid_early flag for tracking early payments
    
  2. Changes
    - Add new columns to payments table
    - Set default values and constraints
*/

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS reference_month date,
ADD COLUMN IF NOT EXISTS paid_early boolean DEFAULT false;

-- Add comment to explain reference_month format
COMMENT ON COLUMN payments.reference_month IS 'Stores the month/year this payment refers to (day is ignored)';