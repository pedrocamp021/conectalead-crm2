/*
  # Add real payment date field
  
  1. New Fields
    - Add data_pagamento_real to track the actual payment date
    
  2. Changes
    - Add new column to clients table
*/

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS data_pagamento_real timestamptz;