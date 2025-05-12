/*
  # Add labels and notes to leads

  1. New Tables
    - `lead_labels`
      - `id` (uuid, primary key)
      - `name` (text)
      - `color` (text)
      - `client_id` (uuid, foreign key)
      - `created_at` (timestamptz)

    - `lead_label_assignments`
      - `lead_id` (uuid, foreign key)
      - `label_id` (uuid, foreign key)
      - Primary key is (lead_id, label_id)

  2. Changes
    - Add `notes` column to `leads` table

  3. Security
    - Enable RLS on new tables
    - Add policies for client access
*/

-- Add notes column to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;

-- Create labels table
CREATE TABLE IF NOT EXISTS lead_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create label assignments table
CREATE TABLE IF NOT EXISTS lead_label_assignments (
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  label_id uuid REFERENCES lead_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, label_id)
);

-- Enable RLS
ALTER TABLE lead_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_label_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_labels
CREATE POLICY "Clients can view own labels"
  ON lead_labels
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clients can insert own labels"
  ON lead_labels
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own labels"
  ON lead_labels
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Clients can delete own labels"
  ON lead_labels
  FOR DELETE
  TO authenticated
  USING (client_id = auth.uid());

-- RLS Policies for lead_label_assignments
CREATE POLICY "Clients can manage own lead labels"
  ON lead_label_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_id
      AND leads.client_id = auth.uid()
    )
  );