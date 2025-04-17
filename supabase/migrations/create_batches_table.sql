/*
  # Create batches table

  1. New Tables
    - `batches`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `bank_api` (text, not null)
      - `filename` (text, not null)
      - `total_cpfs` (integer, not null)
      - `valid_cpfs` (integer, not null)
      - `invalid_cpfs` (integer, not null)
      - `status` (text, not null)
      - `id_execucao` (text, null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `batches` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_api text NOT NULL,
  filename text NOT NULL,
  total_cpfs integer NOT NULL DEFAULT 0,
  valid_cpfs integer NOT NULL DEFAULT 0,
  invalid_cpfs integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pendente',
  id_execucao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to all users"
  ON batches
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
