/*
  # Add payment scheduling fields
  
  1. Changes
    - Add dia_pagamento to clients table if not exists
    - Add primeira_parcela field to track first payment
    - Add constraint to ensure dia_pagamento is between 1 and 31
*/

DO $$ 
BEGIN
  -- Add dia_pagamento if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'dia_pagamento'
  ) THEN
    ALTER TABLE clients 
    ADD COLUMN dia_pagamento integer DEFAULT 1 
    CHECK (dia_pagamento BETWEEN 1 AND 31);
  END IF;

  -- Add primeira_parcela if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'primeira_parcela'
  ) THEN
    ALTER TABLE clients 
    ADD COLUMN primeira_parcela boolean DEFAULT true;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_payment_dates ON clients (
  proxima_data_pagamento,
  data_pagamento_real,
  data_pagamento_atual
);

CREATE INDEX IF NOT EXISTS idx_payments_dates ON payments (
  payment_date,
  reference_month
);