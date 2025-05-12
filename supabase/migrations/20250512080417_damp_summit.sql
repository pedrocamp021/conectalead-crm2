/*
  # Add payments table and related fields
  
  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `due_date` (date)
      - `payment_date` (date, nullable)
      - `status` (text: pending, paid, late)
      - `amount` (numeric, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `payments` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  payment_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late')),
  amount numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments table
CREATE POLICY "Admin can manage all payments"
  ON payments
  TO authenticated
  USING (
    (SELECT is_admin FROM clients WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM clients WHERE id = auth.uid())
  );

CREATE POLICY "Clients can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());