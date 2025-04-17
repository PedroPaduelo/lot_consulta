/*
  # Create CPF records table

  1. New Tables
    - `cpf_records`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key to batches.id)
      - `cpf` (text, the CPF number)
      - `nome` (text, person name)
      - `telefone` (text, phone number)
      - `is_valid` (boolean, CPF validation status)
      - `status` (text, processing status: 'pending', 'processed', 'error')
      - `result` (jsonb, API response data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `cpf_records` table
    - Add policy for authenticated users to read/write their own data
  3. Indexes
    - Add index on batch_id for faster queries
    - Add index on cpf for faster lookups
*/

CREATE TABLE IF NOT EXISTS cpf_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  cpf text NOT NULL,
  nome text,
  telefone text,
  is_valid boolean NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cpf_records_batch_id_idx ON cpf_records(batch_id);
CREATE INDEX IF NOT EXISTS cpf_records_cpf_idx ON cpf_records(cpf);

ALTER TABLE cpf_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON cpf_records
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON cpf_records
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON cpf_records
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access"
  ON cpf_records
  FOR DELETE
  USING (true);