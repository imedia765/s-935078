import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  memberNumber: string;
  token: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, memberNumber, token }: RequestBody = await req.json();

    // Log the request details (excluding sensitive info)
    console.log(`Processing password reset request for member: ${memberNumber}`);

    const resetLink = `${req.headers.get("origin")}/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: "Password Reset <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your Password",
      html: `
        <h1>Password Reset Request</h1>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>The link will expire in 1 hour.</p>
        <br>
        <p>Best regards,<br>Your Support Team</p>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Password reset email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});