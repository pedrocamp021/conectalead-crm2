/*
  # Add billing automation fields to clients table
  
  1. Changes
    - Add status column with valid values (ativo, inativo, vencido)
    - Add whatsapp field for sending notifications
    - Add billing_day for payment due date (1-31)
    - Add billing_message for custom payment reminder text
    - Add billing_automation_enabled flag
*/

-- First add the status column if it doesn't exist
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';

-- Add billing automation fields
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS billing_day integer DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 31),
ADD COLUMN IF NOT EXISTS billing_message text,
ADD COLUMN IF NOT EXISTS billing_automation_enabled boolean DEFAULT false;

-- Add constraint for valid status values
ALTER TABLE clients
ADD CONSTRAINT clients_status_check 
CHECK (status IN ('ativo', 'inativo', 'vencido'));

-- Update any null or invalid status values
UPDATE clients 
SET status = 'ativo' 
WHERE status IS NULL OR status NOT IN ('ativo', 'inativo', 'vencido');