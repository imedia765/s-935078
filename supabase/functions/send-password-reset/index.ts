
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest, corsHeaders, isAllowedOrigin, PRODUCTION_URL } from "./validation.ts";
import { validateLoopsConfig, getLoopsIntegration, sendLoopsEmail } from "./loops.ts";
import { checkRateLimit, logAuditEvent } from "./audit.ts";

serve(async (req) => {
  const origin = req.headers.get('origin');
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  const isAllowed = isAllowedOrigin(origin);
  
  // Set CORS headers for all responses
  const responseHeaders = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': isAllowed ? origin! : 'https://www.pwaburton.co.uk'
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
    // Validate request data
    const requestData = validateRequest(await req.json());
    const { email, memberNumber, token, isVerification } = requestData;

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

    // Validate Loops configuration
    await validateLoopsConfig();
    const loopsIntegration = await getLoopsIntegration();

    // Generate action link
    const actionLink = `${PRODUCTION_URL}/reset-password?${isVerification ? 'verify' : 'token'}=${token}&ref=email`;

    console.log('Making request to Loops API:', {
      email,
      memberNumber,
      actionLink,
      isVerification,
      origin
    });

    try {
      // Send email via Loops
      const loopsResult = await sendLoopsEmail(
        loopsIntegration,
        email,
        memberNumber,
        actionLink,
        isVerification
      );

      console.log(`${isVerification ? 'Verification' : 'Reset'} email sent successfully:`, loopsResult);

      // Log the successful action
      await logAuditEvent({
        operation: isVerification ? 'email_verification_requested' : 'password_reset_requested',
        tableName: isVerification ? 'password_reset_email_transitions' : 'password_reset_tokens',
        recordId: token,
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
      await logAuditEvent({
        operation: isVerification ? 'email_verification_failed' : 'password_reset_failed',
        tableName: isVerification ? 'password_reset_email_transitions' : 'password_reset_tokens',
        recordId: token,
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
