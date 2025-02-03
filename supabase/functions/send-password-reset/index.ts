import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, memberNumber, token } = await req.json();
    const resetUrl = `${req.headers.get("origin")}/reset-password?token=${token}`;

    console.log("Sending password reset email to:", email);
    console.log("Reset URL:", resetUrl);

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 587,
        tls: true,
        auth: {
          username: "burtonpwa@gmail.com",
          password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
        }
      }
    });

    await client.send({
      from: "PWA Burton <burtonpwa@gmail.com>",
      to: email,
      subject: "Reset Your Password",
      content: "Please enable HTML to view this email",
      html: `
        <h1>Password Reset Request</h1>
        <p>Hello Member ${memberNumber},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>PWA Burton Team</p>
      `,
    });

    await client.close();

    console.log("Email sent successfully to:", email);

    return new Response(
      JSON.stringify({ message: "Password reset email sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});