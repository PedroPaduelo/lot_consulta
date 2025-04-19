/*
  # Create RPC for get_batches_with_progress

  Creates a PostgreSQL function (RPC) to fetch batches along with
  the count of processed and pending CPF records for each batch.
  Applies filtering based on user role (admin sees all, operator sees own).

  1. New Function
     - `get_batches_with_progress(is_admin_param boolean, user_id_param uuid)`
     - Returns batches with `processed_count` and `pending_count`.
*/

-- Drop the function if it already exists to allow updates
DROP FUNCTION IF EXISTS public.get_batches_with_progress(boolean, uuid);

-- Create the function
CREATE OR REPLACE FUNCTION public.get_batches_with_progress(
    is_admin_param boolean,
    user_id_param uuid
)
RETURNS TABLE (
    id uuid,
    name text,
    bank_api text,
    filename text,
    total_cpfs integer,
    valid_cpfs integer,
    invalid_cpfs integer,
    status text,
    id_execucao text,
    user_id uuid,
    created_at timestamptz,
    updated_at timestamptz,
    processed_count bigint, -- Count of records not 'Pendente'
    pending_count bigint    -- Count of records 'Pendente'
)
LANGUAGE sql
AS $$
  SELECT
      b.id,
      b.name,
      b.bank_api,
      b.filename,
      b.total_cpfs,
      b.valid_cpfs,
      b.invalid_cpfs,
      b.status,
      b.id_execucao,
      b.user_id,
      b.created_at,
      b.updated_at,
      COUNT(CASE WHEN cr.status != 'Pendente' THEN 1 END) AS processed_count,
      COUNT(CASE WHEN cr.status = 'Pendente' THEN 1 END) AS pending_count
  FROM batches b
  LEFT JOIN cpf_records cr ON b.id = cr.batch_id
  WHERE
    (is_admin_param IS TRUE OR b.user_id = user_id_param) -- Apply filtering based on admin status
  GROUP BY b.id
  ORDER BY b.created_at DESC; -- Order by creation date descending
$$;

-- Grant execution to authenticated users (the Edge Function uses the service role key,
-- but granting to authenticated might be useful for testing or other scenarios)
-- Note: The Edge Function uses the service_role_key, which bypasses RLS and grants.
-- This grant is more for clarity or potential direct RPC calls from trusted contexts.
GRANT EXECUTE ON FUNCTION public.get_batches_with_progress(boolean, uuid) TO authenticated;
