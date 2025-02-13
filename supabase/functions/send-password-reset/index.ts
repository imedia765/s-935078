
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

    console.log(`[${new Date().toISOString()}] Processing reset request for ${memberNumber}`);
    console.log(`[${new Date().toISOString()}] Target email: ${email}`);

    const resetLink = `https://pwaburton.co.uk/reset-password?token=${token}`;

    const { error } = await supabaseAdmin.auth.admin.sendRawEmail({
      to: email,
      subject: "Reset Your Password - PWA Burton",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p>Hello Member ${memberNumber},</p>
            <p>A password reset has been requested for your account. Click the link below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" 
                 style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; word-break: break-all;">
              ${resetLink}
            </p>
            <p><strong>Important:</strong> This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">Best regards,<br>PWA Burton Team</p>
          </div>
        </div>
      `,
      text: `
        Hello Member ${memberNumber},
        
        A password reset has been requested for your account. Click the link below to reset your password:
        
        ${resetLink}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        PWA Burton Team
      `
    });

    if (error) {
      console.error(`[${new Date().toISOString()}] Supabase email error:`, error);
      throw error;
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
