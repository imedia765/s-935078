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

    // Initialize SMTP client
    client = new SmtpClient();

    // Connect to SMTP server
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 587,
      username: "burtonpwa@gmail.com",
      password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
    });

    // Send email
    await client.send({
      from: "PWA Burton <burtonpwa@gmail.com>",
      to: email,
      subject: "Reset Your Password",
      content: "Please enable HTML to view this email",
      html: `
        <h1>Password Reset Request</h1>
        <p>Hello Member ${memberNumber},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>PWA Burton Team</p>
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