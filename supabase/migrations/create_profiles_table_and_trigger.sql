/*
      # Create Profiles Table and Sync Trigger

      Creates a `profiles` table to store public user data and sets up
      a trigger to automatically sync new users from `auth.users`.
      Also configures RLS policies for admin/user access.

      1. New Table
         - `profiles`
           - `id` (uuid, primary key, references auth.users.id)
           - `email` (text, unique)
           - `role` (text, default 'operator')
           - `created_at` (timestamptz)
           - `updated_at` (timestamptz)

      2. New Function
         - `handle_new_user()`: Trigger function to insert into `profiles`.

      3. New Trigger
         - `on_auth_user_created`: Calls `handle_new_user` after insert on `auth.users`.

      4. Security
         - Enable RLS on `profiles`.
         - Policy "Admins can view all profiles": Allows users with 'admin' role (checked via `is_admin()` helper) to select all.
         - Policy "Users can view own profile": Allows authenticated users to select their own profile.
         - Policy "Admins can update any profile": Allows admins to update roles.
         - Policy "Users can update own profile": Allows users to update their own (currently no editable fields, but good practice).
         - Policy "Admins can delete any profile (except own)": Allows admins to delete profiles (linked to user deletion).
    */

    -- 1. Create profiles table
    CREATE TABLE IF NOT EXISTS public.profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE,
      role text DEFAULT 'operator',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Optional: Add index on email for faster lookups
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);


    -- 2. Function to copy new user to profiles table
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER -- Necessary to read from auth.users
    SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, role)
      VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'operator') -- Get role from metadata or default
      );
      RETURN new;
    END;
    $$;

    -- 3. Trigger to call handle_new_user on new user creation
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users; -- Drop existing trigger if necessary
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    -- 4. RLS Policies for profiles table
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Drop existing permissive policies if they exist from previous attempts
    DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
    DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
    DROP POLICY IF EXISTS "Allow individual insert access" ON public.profiles;
    DROP POLICY IF EXISTS "Allow individual delete access" ON public.profiles;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;


    -- SELECT Policies
    CREATE POLICY "Admins can view all profiles"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (is_admin()); -- Assumes is_admin() function exists from previous migration

    CREATE POLICY "Users can view own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);

    -- UPDATE Policies (Example: Allow admin to update role)
    CREATE POLICY "Admins can update any profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());

    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);

    -- DELETE Policies (Admins can delete, mirroring auth.admin.deleteUser)
    -- Note: Deleting from auth.users should cascade delete here due to FOREIGN KEY constraint
    -- This policy might be redundant if cascade is working, but provides explicit control.
    CREATE POLICY "Admins can delete any profile (except own)"
      ON public.profiles
      FOR DELETE
      TO authenticated
      USING (is_admin() AND auth.uid() != id);
