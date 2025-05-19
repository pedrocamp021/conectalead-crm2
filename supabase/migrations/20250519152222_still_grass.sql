/*
  # Add default view preference column
  
  1. Changes
    - Add default_view column to clients table with default value 'kanban'
    
  2. Notes
    - Column accepts 'kanban', 'list', or 'table' values
    - Default value ensures backward compatibility
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'default_view'
  ) THEN
    ALTER TABLE clients 
    ADD COLUMN default_view text DEFAULT 'kanban';
  END IF;
END $$;