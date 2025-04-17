/*
      # Update RLS Policies for Roles

      Updates Row Level Security policies for `batches` and `cpf_records`
      to implement Admin and Operator roles based on user metadata.

      Assumes user roles ('admin' or 'operator') are stored in `auth.users.raw_user_meta_data->>'role'`.

      1. Helper Function
         - Creates `is_admin()` function to check user role.

      2. Batches Table Policies
         - Drops existing permissive policy.
         - Adds SELECT policy: Admins see all, Operators see own.
         - Adds INSERT policy: Authenticated users can insert (user_id defaults to auth.uid()).
         - Adds UPDATE policy: Admins update all, Operators update own.
         - Adds DELETE policy: Admins delete all, Operators delete own.

      3. CPF Records Table Policies
         - Drops existing permissive policy.
         - Adds SELECT policy: Admins see all, Operators see records in own batches.
         - Adds INSERT policy: Authenticated users can insert if they own the batch.
         - Adds UPDATE policy: Admins update all, Operators update records in own batches.
         - Adds DELETE policy: Admins delete all, Operators delete records in own batches.
    */

    -- Helper function to check if the current user is an admin
    -- Reads role from user metadata
    CREATE OR REPLACE FUNCTION is_admin()
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER -- Important for accessing auth.users
    SET search_path = public -- Ensure correct schema context
    AS $$
      SELECT COALESCE(raw_user_meta_data->>'role', 'operator') = 'admin'
      FROM auth.users
      WHERE id = auth.uid();
    $$;

    -- 1. Batches Table RLS Policies
    ----------------------------------
    -- Drop the existing permissive policy first
    DROP POLICY IF EXISTS "Allow full access to all users" ON public.batches;

    -- SELECT: Admins see all, Operators see their own
    CREATE POLICY "Allow SELECT based on role"
      ON public.batches
      FOR SELECT
      TO authenticated
      USING (
        is_admin() OR user_id = auth.uid()
      );

    -- INSERT: Any authenticated user can insert (user_id is set by default)
    CREATE POLICY "Allow INSERT for authenticated users"
      ON public.batches
      FOR INSERT
      TO authenticated
      WITH CHECK (true); -- user_id defaults to auth.uid()

    -- UPDATE: Admins update all, Operators update their own
    CREATE POLICY "Allow UPDATE based on role"
      ON public.batches
      FOR UPDATE
      TO authenticated
      USING (
        is_admin() OR user_id = auth.uid()
      )
      WITH CHECK (
         is_admin() OR user_id = auth.uid()
      );

    -- DELETE: Admins delete all, Operators delete their own
    CREATE POLICY "Allow DELETE based on role"
      ON public.batches
      FOR DELETE
      TO authenticated
      USING (
        is_admin() OR user_id = auth.uid()
      );


    -- 2. CPF Records Table RLS Policies
    ------------------------------------
    -- Drop the existing permissive policy first
    DROP POLICY IF EXISTS "Allow full access to all users" ON public.cpf_records;

    -- SELECT: Admins see all, Operators see records belonging to their batches
    CREATE POLICY "Allow SELECT based on role"
      ON public.cpf_records
      FOR SELECT
      TO authenticated
      USING (
        is_admin() OR
        EXISTS (
          SELECT 1 FROM batches b
          WHERE b.id = cpf_records.batch_id AND b.user_id = auth.uid()
        )
      );

    -- INSERT: Authenticated users can insert if they own the batch
    CREATE POLICY "Allow INSERT for batch owners"
      ON public.cpf_records
      FOR INSERT
      TO authenticated
      WITH CHECK (
        is_admin() OR
        EXISTS (
          SELECT 1 FROM batches b
          WHERE b.id = cpf_records.batch_id AND b.user_id = auth.uid()
        )
      );

    -- UPDATE: Admins update all, Operators update records in their batches
    CREATE POLICY "Allow UPDATE based on role"
      ON public.cpf_records
      FOR UPDATE
      TO authenticated
      USING (
        is_admin() OR
        EXISTS (
          SELECT 1 FROM batches b
          WHERE b.id = cpf_records.batch_id AND b.user_id = auth.uid()
        )
      )
      WITH CHECK (
        is_admin() OR
        EXISTS (
          SELECT 1 FROM batches b
          WHERE b.id = cpf_records.batch_id AND b.user_id = auth.uid()
        )
      );

    -- DELETE: Admins delete all, Operators delete records in their batches
    CREATE POLICY "Allow DELETE based on role"
      ON public.cpf_records
      FOR DELETE
      TO authenticated
      USING (
        is_admin() OR
        EXISTS (
          SELECT 1 FROM batches b
          WHERE b.id = cpf_records.batch_id AND b.user_id = auth.uid()
        )
      );
