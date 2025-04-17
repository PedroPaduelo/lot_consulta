/*
  # Create CPF records table

  1. New Tables
    - `cpf_records`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key to batches.id)
      - `cpf` (text, not null)
      - `nome` (text, not null)
      - `telefone` (text, null)
      - `is_valid` (boolean, not null)
      - `status` (text, not null)
      - `result` (jsonb, null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `cpf_records` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS cpf_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  cpf text NOT NULL,
  nome text NOT NULL,
  telefone text,
  is_valid boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Pendente',
  result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cpf_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to all users"
  ON cpf_records
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
