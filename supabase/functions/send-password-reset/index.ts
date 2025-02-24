
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateRequest, validateEnvironment } from "./validation.ts";
import { validateLoopsConfig, getLoopsIntegration, sendLoopsEmail } from "./loops.ts";
import { logAuditEvent } from "./audit.ts";
import { supabaseAdmin } from "./supabaseClient.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate environment first
    validateEnvironment();
    console.log('Environment validation passed');

    // Get and validate APP_URL
    const appUrl = Deno.env.get('APP_URL')!;
    console.log('Using APP_URL:', appUrl);

    // Validate request
    const data = await req.json();
    const { email, memberNumber, token, isVerification } = validateRequest(data);

    // Validate Loops configuration
    await validateLoopsConfig();
    const loopsIntegration = await getLoopsIntegration();

    // Get client info
    const clientIP = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Initialize response object
    let result;

    // Handle verification or reset email
    if (isVerification) {
      result = await initializeEmailVerification(memberNumber, email, token, clientIP, userAgent);
    } else {
      result = await initializePasswordReset(memberNumber, email, token, clientIP, userAgent);
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to process request');
    }

    // Construct action link with validated APP_URL
    const actionLink = isVerification 
      ? `${appUrl}/reset-password?verify=${token}`
      : `${appUrl}/reset-password?token=${token}`;

    console.log('Generated action link:', actionLink);

    // Send email using Loops
    const response = await sendLoopsEmail(
      loopsIntegration,
      email,
      memberNumber,
      actionLink,
      isVerification
    );

    // Log success with proper operation type
    await logAuditEvent({
      operation: isVerification ? 'email_verify' : 'email_reset',
      tableName: 'password_reset_transitions',
      recordId: memberNumber,
      metadata: {
        email,
        isVerification,
        clientIP,
        success: true,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isVerification ? 
          'Verification email sent successfully' : 
          'Password reset email sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    // Enhanced error logging
    console.error('Error in send-password-reset:', error);
    console.error('Environment variables state:', {
      hasAppUrl: !!Deno.env.get('APP_URL'),
      appUrlValue: Deno.env.get('APP_URL'),
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    });
    
    await logAuditEvent({
      operation: 'email_update',
      tableName: 'password_reset_transitions',
      recordId: 'error',
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      },
      severity: 'error'
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function initializeEmailVerification(
  memberNumber: string,
  email: string,
  token: string,
  clientIP: string,
  userAgent: string
) {
  const { data, error } = await supabaseAdmin.rpc(
    'initiate_password_reset_flow',
    {
      p_member_number: memberNumber,
      p_new_email: email,
      p_ip_address: clientIP,
      p_user_agent: userAgent
    }
  );

  if (error) throw error;
  return data;
}

async function initializePasswordReset(
  memberNumber: string,
  email: string,
  token: string,
  clientIP: string,
  userAgent: string
) {
  const { data, error } = await supabaseAdmin.rpc(
    'initiate_password_reset_flow',
    {
      p_member_number: memberNumber,
      p_ip_address: clientIP,
      p_user_agent: userAgent
    }
  );

  if (error) throw error;
  return data;
}
