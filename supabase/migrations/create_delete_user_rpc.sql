/*
      # Create delete_user_rpc Function

      Creates a SECURITY DEFINER RPC function to allow authenticated admins
      to delete users directly via an RPC call, bypassing Edge Functions.

      1. New Function
         - `delete_user_rpc(user_id_to_delete uuid)`
           - Checks if the caller is an admin using `is_admin()`.
           - Prevents self-deletion.
           - Calls `auth.admin_delete_user()` to delete the target user.
           - Returns a success message.

      2. Security
         - Uses `SECURITY DEFINER` to execute with elevated privileges.
         - Internal checks ensure only authorized admins can perform deletion.
         - Grant EXECUTE permission to `authenticated` role.
    */

    -- Drop function if it exists to apply changes
    DROP FUNCTION IF EXISTS public.delete_user_rpc(uuid);

    -- Create the RPC function
    CREATE OR REPLACE FUNCTION public.delete_user_rpc(user_id_to_delete uuid)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER -- Runs with the privileges of the function owner
    SET search_path = public -- Ensure functions like is_admin() are found
    AS $$
    DECLARE
      caller_is_admin boolean;
      caller_id uuid;
      deleted_user_email text;
      response json;
    BEGIN
      -- Get the ID and admin status of the user calling this function
      caller_id := auth.uid();
      SELECT is_admin() INTO caller_is_admin;

      -- Check 1: Ensure the caller is an admin
      IF caller_is_admin IS FALSE THEN
        RAISE EXCEPTION 'Permission denied: Caller is not an admin.';
      END IF;

      -- Check 2: Prevent self-deletion
      IF caller_id = user_id_to_delete THEN
        RAISE EXCEPTION 'Permission denied: Cannot delete your own account.';
      END IF;

      -- Optional: Get email before deleting for logging/response (requires querying auth.users)
      -- This might fail if the user doesn't exist, handle gracefully
      BEGIN
          SELECT u.email INTO deleted_user_email FROM auth.users u WHERE u.id = user_id_to_delete;
      EXCEPTION WHEN NO_DATA_FOUND THEN
          deleted_user_email := 'unknown (user not found)';
      END;


      -- Perform the deletion using the built-in Supabase admin function
      PERFORM auth.admin_delete_user(user_id_to_delete);

      -- If deletion was successful, return success message
      response := json_build_object(
          'success', true,
          'message', 'Usuário (' || COALESCE(deleted_user_email, user_id_to_delete::text) || ') excluído com sucesso!'
      );
      RETURN response;

    EXCEPTION
      -- Catch specific exceptions if needed, e.g., user not found from auth.admin_delete_user
      WHEN others THEN
        -- Log the error? Supabase might log it automatically.
        -- Return a JSON error object
        response := json_build_object(
            'success', false,
            'error', SQLERRM -- SQLERRM contains the error message
        );
        RETURN response;
    END;
    $$;

    -- Grant execute permission to the 'authenticated' role
    -- Security is handled inside the function by checking the caller's role
    GRANT EXECUTE ON FUNCTION public.delete_user_rpc(uuid) TO authenticated;
