/*
  # Update cpf_records table RLS policies

  1. Changes
    - Drop existing RLS policies on cpf_records table
    - Create new, more permissive policies for anonymous access
    - Allow public access for development/testing purposes
  
  2. Security
    - Note: These policies are intentionally permissive for development
    - In production, you would want more restrictive policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all CPF records" ON cpf_records;
DROP POLICY IF EXISTS "Users can insert CPF records" ON cpf_records;
DROP POLICY IF EXISTS "Users can update CPF records" ON cpf_records;
DROP POLICY IF EXISTS "Users can delete CPF records" ON cpf_records;

-- Create new, more permissive policies
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