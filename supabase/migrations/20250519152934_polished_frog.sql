/*
  # Add default_view column to clients table
  
  1. Changes
    - Adds default_view column to clients table with default value 'kanban'
    
  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Sets default value to ensure backward compatibility
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