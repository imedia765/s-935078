
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.8.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  memberNumber: string;
  token: string;
}

async function createSmtpClient(): Promise<SmtpClient> {
  const client = new SmtpClient();
  
  await client.connectTLS({
    hostname: "smtp.gmail.com",
    port: 587,
    username: "burtonpwa@gmail.com",
    password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
    debug: true, // Enable debug mode for better error logging
  });
  
  return client;
}

async function sendEmailWithRetry(options: any, maxRetries = 3): Promise<void> {
  let lastError: Error | null = null;
  let client: SmtpClient | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${new Date().toISOString()}] Creating new SMTP client for attempt ${attempt}`);
      client = await createSmtpClient();
      
      console.log(`[${new Date().toISOString()}] Attempting to send email (attempt ${attempt})`);
      await client.send(options);
      
      console.log(`[${new Date().toISOString()}] Email sent successfully on attempt ${attempt}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`[${new Date().toISOString()}] Error on attempt ${attempt}:`, error);
      
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          console.error(`[${new Date().toISOString()}] Error closing SMTP client:`, closeError);
        }
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        console.log(`[${new Date().toISOString()}] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to send email after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

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

    const emailContent = `
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
    `;

    await sendEmailWithRetry({
      from: "PWA Burton <burtonpwa@gmail.com>",
      to: email,
      subject: "Reset Your Password - PWA Burton",
      content: "Please enable HTML to view this email",
      html: emailContent,
      priority: "high"
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
