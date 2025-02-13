
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

interface SmtpError extends Error {
  code?: string;
  command?: string;
}

class EmailError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'EmailError';
  }
}

async function createSmtpClient(): Promise<SmtpClient> {
  const client = new SmtpClient();

  console.log(`[${new Date().toISOString()}] Establishing SMTP connection...`);
  
  const connectConfig = {
    hostname: "smtp.gmail.com",
    port: 465,
    username: "burtonpwa@gmail.com",
    password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
  };

  await client.connectTLS(connectConfig);
  console.log(`[${new Date().toISOString()}] SMTP connection established`);
  
  return client;
}

async function sendEmailWithRetry(options: any, maxRetries = 3): Promise<void> {
  let lastError: SmtpError | null = null;
  let client: SmtpClient | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${new Date().toISOString()}] Email attempt ${attempt} of ${maxRetries}`);
      
      if (!client) {
        client = await createSmtpClient();
      }
      
      console.log(`[${new Date().toISOString()}] Sending email...`);
      await client.send(options);
      
      console.log(`[${new Date().toISOString()}] Email sent successfully on attempt ${attempt}`);
      
      if (client) {
        await client.close();
      }
      
      return;
      
    } catch (error) {
      lastError = error as SmtpError;
      console.error(`[${new Date().toISOString()}] Error on attempt ${attempt}:`, {
        name: error.name,
        message: error.message,
        code: (error as SmtpError).code,
        command: (error as SmtpError).command,
      });
      
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          console.error(`[${new Date().toISOString()}] Error closing SMTP client:`, closeError);
        }
        client = null;
      }
      
      // Determine if we should retry based on error type
      const shouldRetry = !lastError.code?.includes('5.') && attempt < maxRetries;
      
      if (shouldRetry) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        console.log(`[${new Date().toISOString()}] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  
  throw new EmailError(
    `Failed to send email after ${maxRetries} attempts`,
    lastError || undefined
  );
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
      html: emailContent
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
