import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const ALLOWED_ORIGINS = [
  'https://www.pwaburton.co.uk',
  'http://localhost:5173',
  'https://*.lovableproject.com'
];

const PRODUCTION_URL = 'https://www.pwaburton.co.uk';

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
  isVerification: boolean;
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(origin);
    }
    return pattern === origin;
  });
}

async function checkRateLimit(ipAddress: string, memberNumber: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('check_password_reset_rate_limit', { 
      p_ip_address: ipAddress,
      p_member_number: memberNumber 
    });

  if (error) {
    console.error('Rate limit check error:', error);
    return false;
  }

  return data?.allowed ?? false;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  const isAllowed = isAllowedOrigin(origin);
  
  // Set CORS headers for all responses
  const responseHeaders = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': isAllowed ? origin! : ALLOWED_ORIGINS[0]
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: responseHeaders });
  }

  // Validate origin
  if (!isAllowed) {
    console.error('Invalid origin:', origin);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid origin',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 403,
        headers: { 
          ...responseHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    const requestData = await req.json() as RequestBody;
    const { email, memberNumber, token, isVerification } = requestData;

    // Input validation
    if (!email || !memberNumber || !token) {
      throw new Error('Missing required fields');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check rate limiting
    const isAllowedByRateLimit = await checkRateLimit(clientIp, memberNumber);
    if (!isAllowedByRateLimit) {
      console.warn('Rate limit exceeded:', { ip: clientIp, memberNumber });
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 429,
          headers: {
            ...responseHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log(`[${new Date().toISOString()}] Starting ${isVerification ? 'email verification' : 'password reset'} process for ${memberNumber}`);

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

    // Always use production URL for reset/verify links
    const actionLink = `${PRODUCTION_URL}/reset-password?${isVerification ? 'verify' : 'token'}=${token}&ref=email`;

    console.log('Making request to Loops API:', {
      templateId: loopsIntegration.password_reset_template_id,
      email,
      memberNumber,
      actionLink,
      isVerification,
      origin
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
            resetUrl: actionLink,
            memberNumber: memberNumber,
            isVerification: isVerification
          }
        })
      });

      // Enhanced response logging
      const responseDetails = {
        status: loopsResponse.status,
        statusText: loopsResponse.statusText,
        headers: Object.fromEntries(loopsResponse.headers.entries()),
        origin: origin,
        actionLink: actionLink,
        clientIp: clientIp,
        isVerification: isVerification
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
      console.log(`${isVerification ? 'Verification' : 'Reset'} email sent successfully:`, loopsResult);

      // Log the successful action
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          operation: isVerification ? 'email_verification_requested' : 'password_reset_requested',
          table_name: isVerification ? 'password_reset_email_transitions' : 'password_reset_tokens',
          record_id: token,
          metadata: {
            member_number: memberNumber,
            generated_at: new Date().toISOString(),
            success: true,
            origin: origin,
            action_link: actionLink,
            ip_address: clientIp,
            is_verification: isVerification
          },
          severity: 'info'
        });

      return new Response(
        JSON.stringify({ 
          message: `${isVerification ? 'Verification' : 'Password reset'} email sent successfully`,
          timing: {
            timestamp: new Date().toISOString()
          }
        }),
        { 
          headers: { 
            ...responseHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );

    } catch (loopsError: any) {
      console.error('Error calling Loops API:', {
        error: loopsError,
        message: loopsError.message,
        stack: loopsError.stack,
        origin: origin,
        clientIp: clientIp,
        isVerification: isVerification
      });

      // Log the failed attempt
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          operation: isVerification ? 'email_verification_failed' : 'password_reset_failed',
          table_name: isVerification ? 'password_reset_email_transitions' : 'password_reset_tokens',
          record_id: token,
          metadata: {
            member_number: memberNumber,
            error: loopsError.message,
            timestamp: new Date().toISOString(),
            origin: origin,
            ip_address: clientIp,
            is_verification: isVerification
          },
          severity: 'error'
        });

      throw new Error(`Failed to send ${isVerification ? 'verification' : 'reset'} email through Loops: ${loopsError.message}`);
    }

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error:`, {
      error: error,
      message: error.message,
      stack: error.stack,
      origin: origin,
      clientIp: clientIp
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        code: error.code || 'UNKNOWN_ERROR',
        timing: {
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { 
          ...responseHeaders,
          'Content-Type': 'application/json'
        },
        status: error.message?.includes('Too many requests') ? 429 : 500
      }
    );
  }
});
