import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  memberNumber: string;
  token: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: SmtpClient | null = null;
  const connectionStart = Date.now();
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const { email, memberNumber, token }: RequestBody = await req.json();
      const resetLink = `${req.headers.get("origin")}/reset-password?token=${token}`;

      console.log(`[${Date.now()}] Starting password reset email process for ${memberNumber} (attempt ${retries + 1})`);
      console.log(`[${Date.now()}] Target email: ${email}`);
      
      client = new SmtpClient();
      console.log(`[${Date.now()}] SMTP client initialized`);

      try {
        console.log(`[${Date.now()}] Connecting to SMTP server...`);
        await client.connectTLS({
          hostname: "smtp.gmail.com",
          port: 587,
          username: "burtonpwa@gmail.com",
          password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
          timeout: 5000 // 5 second timeout
        });
        console.log(`[${Date.now()}] SMTP connection established successfully`);
        
        // Use a simpler email template for testing
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

        await client.send({
          from: "PWA Burton <burtonpwa@gmail.com>",
          to: email,
          subject: "Reset Your Password",
          content: "Please enable HTML to view this email",
          html: emailContent,
        });
        
        console.log(`[${Date.now()}] Email sent successfully`);
        
        // If we get here, email was sent successfully
        break;
      } catch (connError) {
        console.error(`[${Date.now()}] SMTP connection error:`, connError);
        retries++;
        
        if (retries >= MAX_RETRIES) {
          throw new Error(`Failed to connect to SMTP server after ${MAX_RETRIES} attempts: ${connError.message}`);
        }
        
        console.log(`[${Date.now()}] Retrying in ${RETRY_DELAY/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }

      const totalTime = Date.now() - connectionStart;
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
  }
});