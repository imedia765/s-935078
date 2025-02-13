
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { resolveMx, resolveTxt } from "https://deno.land/std@0.204.0/node/dns.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DnsCheckResult {
  recordType: 'MX' | 'SPF' | 'DKIM' | 'DMARC';
  status: 'success' | 'warning' | 'error';
  value?: string;
  errorMessage?: string;
}

async function checkDnsRecord(domain: string, recordType: string): Promise<DnsCheckResult> {
  try {
    switch (recordType) {
      case 'MX': {
        const records = await resolveMx(domain);
        return {
          recordType: 'MX',
          status: records.length > 0 ? 'success' : 'warning',
          value: JSON.stringify(records)
        };
      }
      case 'SPF': {
        const records = await resolveTxt(domain);
        const spfRecord = records.flat().find(r => r.startsWith('v=spf1'));
        return {
          recordType: 'SPF',
          status: spfRecord ? 'success' : 'warning',
          value: spfRecord || 'No SPF record found'
        };
      }
      case 'DKIM': {
        // Default selector 'default'
        try {
          const records = await resolveTxt(`default._domainkey.${domain}`);
          return {
            recordType: 'DKIM',
            status: records.length > 0 ? 'success' : 'warning',
            value: records.flat()[0] || 'No DKIM record found'
          };
        } catch {
          return {
            recordType: 'DKIM',
            status: 'warning',
            value: 'No DKIM record found'
          };
        }
      }
      case 'DMARC': {
        try {
          const records = await resolveTxt(`_dmarc.${domain}`);
          const dmarcRecord = records.flat().find(r => r.startsWith('v=DMARC1'));
          return {
            recordType: 'DMARC',
            status: dmarcRecord ? 'success' : 'warning',
            value: dmarcRecord || 'No DMARC record found'
          };
        } catch {
          return {
            recordType: 'DMARC',
            status: 'warning',
            value: 'No DMARC record found'
          };
        }
      }
      default:
        throw new Error(`Unsupported record type: ${recordType}`);
    }
  } catch (error) {
    return {
      recordType: recordType as any,
      status: 'error',
      errorMessage: error.message
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    
    if (!domain) {
      throw new Error('Domain is required');
    }

    const recordTypes = ['MX', 'SPF', 'DKIM', 'DMARC'];
    const results = await Promise.all(
      recordTypes.map(type => checkDnsRecord(domain, type))
    );

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store results in database
    const { error: insertError } = await supabaseClient
      .from('dns_check_results')
      .insert(
        results.map(result => ({
          record_type: result.recordType,
          domain,
          status: result.status,
          value: result.value,
          error_message: result.errorMessage,
          last_success_at: result.status === 'success' ? new Date().toISOString() : null
        }))
      );

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
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
