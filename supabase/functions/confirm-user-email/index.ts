import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user by email
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email
      }
    })

    if (getUserError || !users || users.length === 0) {
      throw new Error('User not found')
    }

    // Update the user's email confirmation status
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      users[0].id,
      { email_confirm: true }
    )

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ message: 'Email confirmed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})