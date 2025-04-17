import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
    import { corsHeaders } from '../_shared/cors.ts'

    console.log(`Function "create-user" up and running!`)

    serve(async (req: Request) => {
      // Handle CORS preflight requests
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
      }

      try {
        // 1. Validate Authorization (ensure caller is an admin)
        // Create a Supabase client with the Auth context of the caller.
        // This requires the ANON_KEY and the caller's JWT.
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          throw new Error('Missing authorization header')
        }

        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        )

        // Get the user profile based on the JWT
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
          console.error('User fetch error:', userError)
          return new Response(JSON.stringify({ error: 'Authentication failed: Could not retrieve user.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          })
        }

        // Check if the user has the 'admin' role in their metadata
        const userRole = user.user_metadata?.role
        console.log(`Caller role: ${userRole}`) // Log the role
        if (userRole !== 'admin') {
          return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403, // Forbidden
          })
        }

        // 2. Parse Request Body
        const { email, password, role } = await req.json()
        if (!email || !password || !role) {
          return new Response(JSON.stringify({ error: 'Missing required fields: email, password, role' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
        }
        if (role !== 'admin' && role !== 'operator') {
           return new Response(JSON.stringify({ error: 'Invalid role specified. Must be "admin" or "operator".' }), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             status: 400,
           })
        }


        // 3. Create Admin Client (using Service Role Key)
        // IMPORTANT: Never expose the SERVICE_ROLE_KEY to the client.
        // It's securely accessed here from environment variables.
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Create User using Admin Client
        console.log(`Attempting to create user: ${email} with role: ${role}`)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: false, // Typically disable email confirmation for admin-created users
          user_metadata: { role: role }, // Set the role here
        })

        if (createError) {
          console.error('Supabase admin createUser error:', createError)
          // Provide more specific feedback if possible
          let errorMessage = createError.message
          if (errorMessage.includes('User already registered')) {
              errorMessage = 'Este email já está registrado.'
          } else if (errorMessage.includes('Password should be at least 6 characters')) {
              errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
          }
          return new Response(JSON.stringify({ error: `Falha ao criar usuário: ${errorMessage}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400, // Bad Request or appropriate error code
          })
        }

        console.log('User created successfully:', newUser)

        // 5. Return Success Response
        return new Response(JSON.stringify({ message: 'Usuário criado com sucesso!', user: newUser.user }), { // Return limited user info
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
