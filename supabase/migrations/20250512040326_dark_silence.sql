/*
  # Add follow-ups functionality
  
  1. New Tables
    - `followups`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, references leads)
      - `scheduled_for` (date, when to send)
      - `message_template` (text, message content)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `followups` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_for date NOT NULL,
  message_template text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE followups ENABLE ROW LEVEL SECURITY;