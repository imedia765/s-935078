
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as RequestBody;
    const { email, memberNumber, token } = requestData;

    if (!email || !memberNumber || !token) {
      throw new Error('Missing required fields');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    console.log(`[${new Date().toISOString()}] Processing reset request for ${memberNumber}`);

    const resetLink = `https://pwaburton.co.uk/reset-password?token=${token}`;

    // Get Loops configuration
    const { data: loopsConfig, error: configError } = await supabaseAdmin
      .from('loops_integration')
      .select('*')
      .single();

    if (configError) {
      console.error('Loops config error:', configError);
      throw new Error('Failed to get Loops configuration');
    }

    if (!loopsConfig.api_key || !loopsConfig.template_id) {
      throw new Error('Loops configuration is incomplete');
    }

    try {
      // Use Loops API to send email
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
        const errorData = await loopsResponse.text();
        console.error('Loops API error response:', errorData);
        throw new Error(`Loops API error: ${errorData}`);
      }

      const loopsResult = await loopsResponse.json();
      console.log('Loops email sent successfully:', loopsResult);
    } catch (loopsError: any) {
      console.error('Error calling Loops API:', loopsError);
      throw new Error(loopsError.message || 'Failed to send email through Loops');
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
