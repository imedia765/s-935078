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

  try {
    const { email, memberNumber, token }: RequestBody = await req.json();

    console.log(`Sending password reset email to ${email} for member ${memberNumber}`);
    
    const resetLink = `${req.headers.get("origin")}/reset-password?token=${token}`;

    // Initialize SMTP client with connection config
    client = new SmtpClient();
    
    console.log("Connecting to SMTP server...");

    // Connect with explicit TLS
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 587,
      username: "burtonpwa@gmail.com",
      password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
    });

    console.log("Connected to SMTP server, sending email...");

    // Send email with enhanced HTML template
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

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ message: "Password reset email sent" }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error) {
    console.error("Error sending password reset email:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send password reset email" 
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
        await client.close();
        console.log("SMTP connection closed");
      } catch (error) {
        console.error("Error closing SMTP connection:", error);
      }
    }
  }
});