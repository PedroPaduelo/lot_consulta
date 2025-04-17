/*
  # Update batches table RLS policies

  1. Changes
    - Drop existing RLS policies on batches table
    - Create new, more permissive policies for anonymous access
    - Allow public access for development/testing purposes
  
  2. Security
    - Note: These policies are intentionally permissive for development
    - In production, you would want more restrictive policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all batches" ON batches;
DROP POLICY IF EXISTS "Users can insert batches" ON batches;
DROP POLICY IF EXISTS "Users can update batches" ON batches;
DROP POLICY IF EXISTS "Users can delete batches" ON batches;

-- Create new, more permissive policies
CREATE POLICY "Allow public read access"
  ON batches
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON batches
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON batches
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access"
  ON batches
  FOR DELETE
  USING (true);