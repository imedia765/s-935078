
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly rate: number;
  private readonly interval: number;

  constructor(rate: number, interval: number) {
    this.tokens = rate;
    this.lastRefill = Date.now();
    this.rate = rate;
    this.interval = interval;
  }

  private refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.interval) * this.rate;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.rate, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  tryAcquire(): boolean {
    this.refillTokens();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }

  getCurrentCount(): number {
    this.refillTokens();
    return this.tokens;
  }
}

// Rate limiting setup - 100 emails per hour
const rateLimiter = new RateLimiter(100, 60 * 60 * 1000);

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromAddress: string;
  secure: boolean;
}

async function getSmtpConfig(): Promise<SmtpConfig> {
  // For Gmail, we'll use these settings
  return {
    host: "smtp.gmail.com",
    port: 587,
    username: "burtonpwa@gmail.com",
    password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
    fromAddress: "PWA Burton <burtonpwa@gmail.com>",
    secure: true,
  };
}

async function logEmailAttempt(success: boolean, error?: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Email attempt:`, {
    success,
    error: error || 'None',
    rateLimit: rateLimiter.getCurrentCount()
  });
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check rate limit
    if (!rateLimiter.tryAcquire()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const { to, subject, html, text } = await req.json();
    const config = await getSmtpConfig();

    // Validate input
    if (!to || !subject || (!html && !text)) {
      throw new Error('Missing required fields: to, subject, and either html or text content');
    }

    // Initialize SMTP client with Gmail settings
    const client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: config.secure,
        auth: {
          username: config.username,
          password: config.password,
        }
      }
    });

    console.log(`[${new Date().toISOString()}] Attempting to send email to ${to}`);

    await client.send({
      from: config.fromAddress,
      to: to,
      subject: subject,
      content: text || "Please enable HTML to view this email",
      html: html,
    });

    await client.close();
    await logEmailAttempt(true);

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
    await logEmailAttempt(false, error.message);

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
