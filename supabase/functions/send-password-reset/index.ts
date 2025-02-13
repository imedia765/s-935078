
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

async function sendEmailWithRetry(client: SmtpClient, options: any, maxRetries = 3): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${new Date().toISOString()}] Email send attempt ${attempt}/${maxRetries}`);
      await client.send(options);
      console.log(`[${new Date().toISOString()}] Email sent successfully on attempt ${attempt}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`[${new Date().toISOString()}] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`[${new Date().toISOString()}] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to send email after ${maxRetries} attempts. Last error: ${lastError?.message}`);
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
    
    const client = new SmtpClient();
    console.log(`[${new Date().toISOString()}] SMTP client initialized`);

    try {
      console.log(`[${new Date().toISOString()}] Connecting to SMTP server...`);
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 587,
        username: "burtonpwa@gmail.com",
        password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
        timeout: 10000 // 10 second timeout for better reliability
      });
      console.log(`[${new Date().toISOString()}] SMTP connection established successfully`);

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

      await sendEmailWithRetry(client, {
        from: "PWA Burton <burtonpwa@gmail.com>",
        to: email,
        subject: "Reset Your Password",
        content: "Please enable HTML to view this email",
        html: emailContent,
      });
      
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

    } catch (smtpError) {
      console.error(`[${new Date().toISOString()}] SMTP error:`, smtpError);
      throw new Error(`SMTP error: ${smtpError.message}`);
    } finally {
      if (client) {
        try {
          console.log(`[${new Date().toISOString()}] Closing SMTP connection...`);
          await client.close();
          console.log(`[${new Date().toISOString()}] SMTP connection closed successfully`);
        } catch (closeError) {
          console.error(`[${new Date().toISOString()}] Error closing SMTP connection:`, closeError);
        }
      }
    }
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
