/*
  # Add payment tracking fields to clients table

  1. New Fields
    - `data_pagamento_atual` (timestamp) - Current payment date
    - `proxima_data_pagamento` (timestamp) - Next payment due date
    - `pagamento_confirmado` (boolean) - Payment confirmation flag

  2. Changes
    - Add new columns to clients table
    - Add default values and constraints
*/

-- Add new payment tracking columns
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS data_pagamento_atual timestamptz,
ADD COLUMN IF NOT EXISTS proxima_data_pagamento timestamptz,
ADD COLUMN IF NOT EXISTS pagamento_confirmado boolean DEFAULT false;

-- Update status check constraint to include 'pendente'
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_status_check;

ALTER TABLE clients 
ADD CONSTRAINT clients_status_check 
CHECK (status = ANY (ARRAY['ativo'::text, 'inativo'::text, 'pendente'::text]));