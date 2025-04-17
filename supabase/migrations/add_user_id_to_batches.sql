/*
      # Add user_id to batches table

      1. Changes
        - Add `user_id` column to `batches` table.
        - Set default value to `auth.uid()`.
        - Add foreign key constraint to `auth.users`.
    */

    -- Add the user_id column if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'batches' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE public.batches
        ADD COLUMN user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
      END IF;
    END $$;

    -- Add an index for faster lookups by user_id
    CREATE INDEX IF NOT EXISTS idx_batches_user_id ON public.batches(user_id);