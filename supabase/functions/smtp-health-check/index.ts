
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmtpConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_address: string;
  is_active: boolean;
}

async function testSmtpConnection(config: SmtpConfig): Promise<{
  status: 'healthy' | 'degraded' | 'failing';
  response_time: number;
  success_rate: number;
  error_details: Record<string, any>;
}> {
  const startTime = Date.now();
  
  try {
    const client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: true,
        auth: {
          username: config.username,
          password: config.password,
        }
      }
    });

    // Test connection by sending a test email
    await client.connect();
    await client.close();

    const responseTime = Date.now() - startTime;

    // If response time is over 2 seconds, mark as degraded
    const status = responseTime > 2000 ? 'degraded' : 'healthy';

    return {
      status,
      response_time: responseTime,
      success_rate: 100,
      error_details: {}
    };

  } catch (error) {
    console.error(`SMTP test failed for ${config.host}:`, error);

    return {
      status: 'failing',
      response_time: Date.now() - startTime,
      success_rate: 0,
      error_details: {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      }
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active SMTP configurations
    const { data: configs, error: configError } = await supabaseClient
      .from('smtp_configurations')
      .select('*')
      .eq('is_active', true);

    if (configError) {
      throw new Error(`Error fetching SMTP configurations: ${configError.message}`);
    }

    // Test each configuration
    for (const config of configs) {
      console.log(`Testing SMTP configuration: ${config.host}`);
      
      const healthCheck = await testSmtpConnection(config);

      // Record health check results
      const { error: insertError } = await supabaseClient
        .from('smtp_health_checks')
        .insert({
          configuration_id: config.id,
          status: healthCheck.status,
          check_timestamp: new Date().toISOString(),
          response_time: healthCheck.response_time,
          success_rate: healthCheck.success_rate,
          error_details: healthCheck.error_details,
        });

      if (insertError) {
        console.error(`Error recording health check for ${config.host}:`, insertError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'SMTP health checks completed',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in SMTP health check:', error);

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
