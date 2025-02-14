
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface LoopsWebhookPayload {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced';
  data: {
    emailId: string;
    timestamp: string;
    recipient: string;
    templateId?: string;
    metadata?: Record<string, any>;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: LoopsWebhookPayload = await req.json()
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Map Loops event types to our event types
    const eventTypeMap = {
      'email.sent': 'delivered',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'failed'
    } as const

    // Find the email log by Loops message ID
    const { data: emailLog, error: lookupError } = await supabaseClient
      .from('email_logs')
      .select('id')
      .eq('provider_message_id', payload.data.emailId)
      .single()

    if (lookupError) {
      throw lookupError
    }

    if (!emailLog) {
      throw new Error('No matching email log found for Loops message ID: ' + payload.data.emailId)
    }

    // Track the event using our new function
    const { error } = await supabaseClient.rpc('track_email_event', {
      p_email_log_id: emailLog.id,
      p_event_type: eventTypeMap[payload.type] || 'delivered',
      p_metadata: {
        provider: 'loops',
        original_event_type: payload.type,
        ...payload.data
      }
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
