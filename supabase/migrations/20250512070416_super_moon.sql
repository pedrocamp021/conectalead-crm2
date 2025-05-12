/*
  # Add billing automation fields to clients table
  
  1. Changes
    - Add whatsapp field for sending notifications
    - Add billing_day for payment due date (1-31)
    - Add billing_message for custom payment reminder text
    - Add billing_automation_enabled flag
*/

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS billing_day integer DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 31),
ADD COLUMN IF NOT EXISTS billing_message text,
ADD COLUMN IF NOT EXISTS billing_automation_enabled boolean DEFAULT false;

-- Update status field to use new values
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_status_check;

ALTER TABLE clients
ADD CONSTRAINT clients_status_check 
CHECK (status IN ('ativo', 'inativo', 'vencido'));

-- Set default status for existing records
UPDATE clients 
SET status = 'ativo' 
WHERE status IS NULL OR status NOT IN ('ativo', 'inativo', 'vencido');