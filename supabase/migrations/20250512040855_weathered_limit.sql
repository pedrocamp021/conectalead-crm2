/*
  # Add status field to followups table

  1. Changes
    - Add status field to followups table with default value 'scheduled'
    - Add check constraint to ensure valid status values
*/

ALTER TABLE followups 
ADD COLUMN IF NOT EXISTS status text 
DEFAULT 'scheduled' 
CHECK (status IN ('scheduled', 'sent', 'cancelled'));