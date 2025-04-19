import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "get-batches-with-progress" up and running!`)

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    // 1. Validate Authorization (ensure user is authenticated)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create a Supabase client with the Auth context of the caller.
    // This requires the ANON_KEY and the caller's JWT.
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

    // Check user role
    const userRole = user.user_metadata?.role
    const isAdmin = userRole === 'admin'
    console.log(`Caller ID: ${user.id}, Role: ${userRole}`)

    // 2. Create Admin Client (using Service Role Key)
    // This client bypasses RLS, so we must apply filtering in the query.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Execute a single query to get batches and aggregated counts
    // Use a LEFT JOIN to include batches with no records yet.
    // Filter by user_id unless the user is an admin.
    const { data: batchesData, error: queryError } = await supabaseAdmin.rpc('get_batches_with_progress', {
        is_admin_param: isAdmin,
        user_id_param: user.id
    });


    if (queryError) {
      console.error('Supabase RPC error (get_batches_with_progress):', queryError)
      return new Response(JSON.stringify({ error: `Falha ao buscar lotes com progresso: ${queryError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log(`Successfully fetched ${batchesData.length} batches with progress.`)

    // 4. Calculate percentage and return
    const batchesWithProgress = batchesData.map((batch: any) => {
        const total = batch.total_cpfs || 0;
        const processed = batch.processed_count || 0;
        const progress_percent = total > 0 ? Math.round((processed / total) * 100) : 0;
        return {
            ...batch,
            processed_count: processed, // Include counts for clarity
            pending_count: batch.pending_count || 0,
            progress_percent: progress_percent,
        };
    });

    // Sort by created_at descending on the backend side is better,
    // but doing it here as a fallback if RPC doesn't sort.
    batchesWithProgress.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


    return new Response(JSON.stringify({ batches: batchesWithProgress }), {
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
