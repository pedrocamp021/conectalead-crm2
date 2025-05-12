/*
  # Add billing configuration system
  
  1. New Tables
    - `billing_settings`
      - `id` (uuid, primary key)
      - `default_message` (text, default message template)
      - `days_before` (integer, days before due date to send notification)
      - `send_on_due_date` (boolean, whether to send on due date)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `billing_settings` table
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_message text NOT NULL,
  days_before integer NOT NULL DEFAULT 3,
  send_on_due_date boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- Only admin can manage billing settings
CREATE POLICY "Admin can manage billing settings"
  ON billing_settings
  TO authenticated
  USING (
    (SELECT is_admin FROM clients WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM clients WHERE id = auth.uid())
  );

-- Insert default settings
INSERT INTO billing_settings (
  default_message,
  days_before,
  send_on_due_date
) VALUES (
  'Olá! Lembramos que seu pagamento vence em breve. Por favor, entre em contato para mais informações.',
  3,
  true
);