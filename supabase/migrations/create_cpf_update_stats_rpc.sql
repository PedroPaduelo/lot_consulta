/*
  # Create RPC Functions for CPF Update Statistics

  Creates PostgreSQL functions (RPC) to fetch statistics about when
  CPF records were last updated. These functions respect user roles
  (admin vs. operator) by checking RLS conditions internally.

  1. New Functions
     - `get_cpf_updates_by_day(start_date timestamptz, end_date timestamptz)`
       - Counts non-pending `cpf_records` updates grouped by day within a range.
       - Filters results based on the calling user's role (admin sees all, operator sees own).
       - Returns `update_day` (date) and `update_count` (bigint).
     - `get_cpf_updates_by_hour(target_date date)`
       - Counts non-pending `cpf_records` updates grouped by hour for a specific date.
       - Filters results based on the calling user's role.
       - Returns `update_hour` (int) and `update_count` (bigint).

  2. Security
     - Functions use `SECURITY INVOKER` to run as the calling user, respecting RLS.
     - Internal logic checks `is_admin()` or `auth.uid()` against `batches.user_id`.
     - Only counts records where `status` is not 'Pendente'.
     - Uses UTC for consistent timezone handling in date/time functions.
     - Grants EXECUTE permission to the `authenticated` role.
*/

-- Drop functions if they exist to apply changes
DROP FUNCTION IF EXISTS public.get_cpf_updates_by_day(timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.get_cpf_updates_by_hour(date);

-- Function to get daily updates
CREATE OR REPLACE FUNCTION public.get_cpf_updates_by_day(
    start_date timestamptz,
    end_date timestamptz
)
RETURNS TABLE(update_day date, update_count bigint)
LANGUAGE plpgsql
SECURITY INVOKER -- Run as the calling user, respecting RLS
AS $$
DECLARE
    caller_is_admin boolean;
BEGIN
    -- Check if the calling user is an admin (assumes is_admin() function exists)
    SELECT is_admin() INTO caller_is_admin;

    RETURN QUERY
    SELECT
        date_trunc('day', cr.updated_at AT TIME ZONE 'UTC')::date AS update_day,
        count(*) AS update_count
    FROM public.cpf_records cr
    -- Join with batches is necessary to check ownership for non-admins
    LEFT JOIN public.batches b ON cr.batch_id = b.id
    WHERE
        cr.updated_at >= start_date
        AND cr.updated_at < end_date
        AND cr.status != 'Pendente' -- Exclude records not yet processed
        AND (caller_is_admin OR b.user_id = auth.uid()) -- Apply RLS logic
    GROUP BY update_day
    ORDER BY update_day;
END;
$$;

-- Function to get hourly updates for a specific date
CREATE OR REPLACE FUNCTION public.get_cpf_updates_by_hour(
    target_date date
)
RETURNS TABLE(update_hour int, update_count bigint)
LANGUAGE plpgsql
SECURITY INVOKER -- Run as the calling user, respecting RLS
AS $$
DECLARE
    caller_is_admin boolean;
BEGIN
    -- Check if the calling user is an admin (assumes is_admin() function exists)
    SELECT is_admin() INTO caller_is_admin;

    RETURN QUERY
    SELECT
        date_part('hour', cr.updated_at AT TIME ZONE 'UTC')::int AS update_hour,
        count(*) AS update_count
    FROM public.cpf_records cr
    -- Join with batches is necessary to check ownership for non-admins
    LEFT JOIN public.batches b ON cr.batch_id = b.id
    WHERE
        date_trunc('day', cr.updated_at AT TIME ZONE 'UTC')::date = target_date
        AND cr.status != 'Pendente' -- Exclude records not yet processed
        AND (caller_is_admin OR b.user_id = auth.uid()) -- Apply RLS logic
    GROUP BY update_hour
    ORDER BY update_hour;
END;
$$;

-- Grant execute permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION public.get_cpf_updates_by_day(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cpf_updates_by_hour(date) TO authenticated;