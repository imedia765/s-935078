import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

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

  let client: SmtpClient | null = null;
  const connectionStart = Date.now();

  try {
    const { email, memberNumber, token }: RequestBody = await req.json();
    const resetLink = `${req.headers.get("origin")}/reset-password?token=${token}`;

    console.log(`[${Date.now()}] Starting password reset email process for ${memberNumber}`);
    console.log(`[${Date.now()}] Target email: ${email}`);
    
    // Initialize SMTP client
    client = new SmtpClient();
    console.log(`[${Date.now()}] SMTP client initialized`);

    try {
      console.log(`[${Date.now()}] Connecting to SMTP server...`);
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 587,
        username: "burtonpwa@gmail.com",
        password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
      });
      console.log(`[${Date.now()}] SMTP connection established successfully`);
    } catch (connError) {
      console.error(`[${Date.now()}] SMTP connection error:`, connError);
      throw new Error(`Failed to connect to SMTP server: ${connError.message}`);
    }

    try {
      console.log(`[${Date.now()}] Attempting to send email...`);
      await client.send({
        from: "PWA Burton <burtonpwa@gmail.com>",
        to: email,
        subject: "Reset Your Password",
        content: "Please enable HTML to view this email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Reset Request</h1>
            <p>Hello Member ${memberNumber},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">
              If the button above doesn't work, copy and paste this link into your browser:<br>
              <span style="color: #0066cc;">${resetLink}</span>
            </p>
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              Best regards,<br>
              PWA Burton Team
            </p>
          </div>
        `,
      });
      console.log(`[${Date.now()}] Email sent successfully`);
    } catch (sendError) {
      console.error(`[${Date.now()}] Error sending email:`, sendError);
      throw new Error(`Failed to send email: ${sendError.message}`);
    }

    const totalTime = Date.now() - connectionStart;
    console.log(`[${Date.now()}] Total operation time: ${totalTime}ms`);

    return new Response(
      JSON.stringify({ 
        message: "Password reset email sent",
        timing: {
          totalTime,
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

  } catch (error) {
    console.error(`[${Date.now()}] Fatal error:`, error);
    const totalTime = Date.now() - connectionStart;
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send password reset email",
        timing: {
          totalTime,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 500,
      }
    );
  } finally {
    if (client) {
      try {
        console.log(`[${Date.now()}] Closing SMTP connection...`);
        await client.close();
        console.log(`[${Date.now()}] SMTP connection closed successfully`);
      } catch (closeError) {
        console.error(`[${Date.now()}] Error closing SMTP connection:`, closeError);
      }
    }
  }
});