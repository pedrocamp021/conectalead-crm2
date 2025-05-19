DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'default_view'
  ) THEN
    ALTER TABLE clients DROP COLUMN default_view;
  END IF;
END $$;