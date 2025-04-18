import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, User } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "delete-user" up and running!`)

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    // CRITICAL: Return 200 OK status for OPTIONS preflight
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    // 1. Validate Authorization (ensure caller is an admin)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: adminUser }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !adminUser) {
      console.error('Admin user fetch error:', userError)
      return new Response(JSON.stringify({ error: 'Authentication failed: Could not retrieve admin user.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const adminRole = adminUser.user_metadata?.role
    if (adminRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      })
    }

    // 2. Parse Request Body to get user ID to delete
    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing required field: userId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 3. Security Check: Prevent admin from deleting themselves
    if (adminUser.id === userId) {
        return new Response(JSON.stringify({ error: 'Cannot delete your own admin account.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403, // Forbidden
        })
    }

    // 4. Create Admin Client (using Service Role Key)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 5. Delete User using Admin Client
    console.log(`Admin user ${adminUser.email} attempting to delete user ID: ${userId}`)
    const { data: deletedData, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Supabase admin deleteUser error:', deleteError)
      // Check for specific errors like "User not found"
      if (deleteError.message.includes('not found')) {
           return new Response(JSON.stringify({ error: `Falha ao excluir: Usuário não encontrado.` }), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             status: 404, // Not Found
           })
      }
      return new Response(JSON.stringify({ error: `Falha ao excluir usuário: ${deleteError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log('User deleted successfully:', userId)

    // 6. Return Success Response
    return new Response(JSON.stringify({ message: 'Usuário excluído com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Internal function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
