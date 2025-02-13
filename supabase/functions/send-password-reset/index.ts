
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  memberNumber: string;
  token: string;
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as RequestBody;
    const { email, memberNumber, token } = requestData;

    // Validate inputs
    if (!email || !memberNumber || !token) {
      throw new Error('Missing required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    console.log(`[${new Date().toISOString()}] Processing reset request for ${memberNumber}`);
    console.log(`[${new Date().toISOString()}] Target email: ${email}`);

    const resetLink = `https://pwaburton.co.uk/reset-password?token=${token}`;

    // Get Loops configuration
    const { data: loopsConfig, error: configError } = await supabaseAdmin
      .from('loops_integration')
      .select('*')
      .limit(1)
      .single();

    if (configError) {
      throw new Error('Failed to get Loops configuration');
    }

    if (!loopsConfig.is_active) {
      // Fallback to default email method if Loops is not active
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          member_number: memberNumber
        },
        password: token // Temporary password that will be changed
      });

      if (error) {
        console.error(`[${new Date().toISOString()}] User creation error:`, error);
        
        // If user exists, send password reset
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: resetLink
          }
        });

        if (resetError) {
          console.error(`[${new Date().toISOString()}] Password reset error:`, resetError);
          throw resetError;
        }
      }
    } else {
      // Use Loops to send the email
      const loopsResponse = await fetch('https://api.loops.so/v1/transactional', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loopsConfig.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionalId: loopsConfig.template_id,
          email: email,
          dataVariables: {
            magic_link_url: resetLink,
            member_number: memberNumber
          }
        })
      });

      if (!loopsResponse.ok) {
        const errorData = await loopsResponse.json();
        console.error(`[${new Date().toISOString()}] Loops API error:`, errorData);
        throw new Error('Failed to send email through Loops');
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: "Password reset email sent successfully",
        timing: {
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send password reset email",
        timing: {
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 500
      }
    );
  }
});
