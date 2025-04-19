import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "list-users" up and running!`)

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    // CRITICAL: Return 200 OK status explicitly for OPTIONS preflight
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('User fetch error:', userError)
      return new Response(JSON.stringify({ error: 'Authentication failed: Could not retrieve user.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      })
    }

    // 2. Create Admin Client (using Service Role Key)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. List Users using Admin Client
    console.log(`Admin user ${user.email} attempting to list users...`)
    // Fetch users, potentially paginated if needed in the future
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        // page: 1, // Example pagination
        // perPage: 50,
    });


    if (listError) {
      console.error('Supabase admin listUsers error:', listError)
      return new Response(JSON.stringify({ error: `Falha ao listar usuários: ${listError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log(`Successfully listed ${users.length} users.`)

    // 4. Return User List (filter sensitive data if necessary, though listUsers is generally safe)
    return new Response(JSON.stringify({ users }), {
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
