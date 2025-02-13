
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  memberNumber: string;
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as RequestBody;
    const { email, memberNumber, token } = requestData;

    console.log(`[${new Date().toISOString()}] Starting password reset email process for ${memberNumber}`);
    console.log(`[${new Date().toISOString()}] Target email: ${email}`);

    // Always use production URL for reset links
    const resetLink = `https://pwaburton.co.uk/reset-password?token=${token}`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello Member ${memberNumber},</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>PWA Burton Team</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "PWA Burton <onboarding@resend.dev>",
      to: email,
      subject: "Reset Your Password",
      html: emailContent,
    });

    if (error) {
      console.error(`[${new Date().toISOString()}] Email sending error:`, error);
      throw error;
    }

    console.log(`[${new Date().toISOString()}] Email sent successfully:`, data);

    return new Response(
      JSON.stringify({ 
        message: "Password reset email sent",
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
