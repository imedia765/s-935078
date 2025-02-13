
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text } = await req.json();

    // Validate input
    if (!to || !subject || (!html && !text)) {
      throw new Error('Missing required fields: to, subject, and either html or text content');
    }

    // Initialize SMTP client with Gmail settings
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

    console.log(`[${new Date().toISOString()}] Attempting to send email to ${to}`);

    await client.send({
      from: "PWA Burton <burtonpwa@gmail.com>",
      to: to,
      subject: subject,
      content: text || "Please enable HTML to view this email",
      html: html,
    });

    await client.close();

    // Log success
    console.log(`[${new Date().toISOString()}] Email sent successfully to ${to}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);

    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Rate limit') ? 429 : 500 
      }
    );
  }
});
