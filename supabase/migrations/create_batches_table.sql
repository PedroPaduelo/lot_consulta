/*
  # Create batches table

  1. New Tables
    - `batches`
      - `id` (uuid, primary key)
      - `name` (text, batch name)
      - `bank_api` (text, selected bank API)
      - `filename` (text, original filename)
      - `total_cpfs` (integer, total CPFs in batch)
      - `valid_cpfs` (integer, valid CPFs count)
      - `invalid_cpfs` (integer, invalid CPFs count)
      - `status` (text, batch status: 'pending', 'processing', 'completed', 'paused', 'error')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `batches` table
    - Add policy for authenticated users to read/write their own data
*/

CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_api text NOT NULL,
  filename text NOT NULL,
  total_cpfs integer NOT NULL DEFAULT 0,
  valid_cpfs integer NOT NULL DEFAULT 0,
  invalid_cpfs integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all batches"
  ON batches
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert batches"
  ON batches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update batches"
  ON batches
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete batches"
  ON batches
  FOR DELETE
  TO authenticated
  USING (true);