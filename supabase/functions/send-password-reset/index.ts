import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const ALLOWED_ORIGINS = [
  'https://www.pwaburton.co.uk',
  'http://localhost:5173'
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(req.headers.get('origin') || '') 
          ? req.headers.get('origin')! 
          : ALLOWED_ORIGINS[0]
      } 
    });
  }

  // Validate origin
  const origin = req.headers.get('origin');
  if (!ALLOWED_ORIGINS.includes(origin || '')) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid origin',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 403,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
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

    console.log(`[${new Date().toISOString()}] Starting password reset process for ${memberNumber}`);

    // Check Loops configuration first
    const { data: loopsConfig, error: configCheckError } = await supabaseAdmin
      .rpc('check_loops_config');

    if (configCheckError) {
      console.error('Error checking Loops config:', configCheckError);
      throw new Error('Failed to check Loops configuration');
    }

    if (!loopsConfig?.[0]?.has_api_key || !loopsConfig?.[0]?.is_active) {
      console.error('Loops integration is not properly configured:', loopsConfig);
      throw new Error('Loops integration is not properly configured or is inactive');
    }

    // Get full Loops configuration
    const { data: loopsIntegration, error: integrationError } = await supabaseAdmin
      .from('loops_integration')
      .select('*')
      .single();

    if (integrationError) {
      console.error('Error fetching Loops integration:', integrationError);
      throw new Error('Failed to get Loops integration details');
    }

    if (!loopsIntegration?.api_key || !loopsIntegration?.password_reset_template_id) {
      console.error('Missing required Loops configuration:', {
        hasApiKey: !!loopsIntegration?.api_key,
        hasTemplateId: !!loopsIntegration?.password_reset_template_id
      });
      throw new Error('Incomplete Loops configuration');
    }

    // Generate reset link - always use non-www domain
    const baseUrl = "https://www.pwaburton.co.uk";
    const resetLink = `${baseUrl}/reset-password?token=${token}&ref=email`;

    console.log('Making request to Loops API:', {
      templateId: loopsIntegration.password_reset_template_id,
      email,
      memberNumber,
      resetLink
    });

    try {
      const loopsResponse = await fetch('https://app.loops.so/api/v1/transactional', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loopsIntegration.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionalId: loopsIntegration.password_reset_template_id,
          email: email,
          dataVariables: {
            resetUrl: resetLink,
            memberNumber: memberNumber
          }
        })
      });

      // Enhanced response logging
      const responseDetails = {
        status: loopsResponse.status,
        statusText: loopsResponse.statusText,
        headers: Object.fromEntries(loopsResponse.headers.entries()),
        origin: origin
      };
      console.log('Loops API response details:', responseDetails);

      if (!loopsResponse.ok) {
        const errorContent = await loopsResponse.text();
        console.error('Loops API error details:', {
          ...responseDetails,
          errorContent
        });
        throw new Error(`Loops API error (${loopsResponse.status}): ${errorContent}`);
      }

      const loopsResult = await loopsResponse.json();
      console.log('Loops email sent successfully:', loopsResult);

      // Log the successful reset link generation
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          operation: 'password_reset_requested',
          table_name: 'password_reset_tokens',
          record_id: token,
          metadata: {
            member_number: memberNumber,
            generated_at: new Date().toISOString(),
            success: true,
            origin: origin
          },
          severity: 'info'
        });

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
            'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
            "Content-Type": "application/json" 
          } 
        }
      );

    } catch (loopsError: any) {
      console.error('Error calling Loops API:', {
        error: loopsError,
        message: loopsError.message,
        stack: loopsError.stack,
        origin: origin
      });

      // Log the failed attempt
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          operation: 'password_reset_failed',
          table_name: 'password_reset_tokens',
          record_id: token,
          metadata: {
            member_number: memberNumber,
            error: loopsError.message,
            timestamp: new Date().toISOString(),
            origin: origin
          },
          severity: 'error'
        });

      throw new Error(`Failed to send email through Loops: ${loopsError.message}`);
    }

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error:`, {
      error: error,
      message: error.message,
      stack: error.stack,
      origin: origin
    });
    
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
          'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
          "Content-Type": "application/json" 
        },
        status: 500
      }
    );
  }
});
