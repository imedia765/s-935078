
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function logAuditEvent({
  operation,
  tableName,
  recordId,
  metadata,
  severity
}: {
  operation: string;
  tableName: string;
  recordId: string;
  metadata: Record<string, any>;
  severity: 'info' | 'error';
}) {
  await supabaseAdmin
    .from('audit_logs')
    .insert({
      operation,
      table_name: tableName,
      record_id: recordId,
      metadata,
      severity
    });
}

export async function checkRateLimit(ipAddress: string, memberNumber: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('check_password_reset_rate_limit', { 
      p_ip_address: ipAddress,
      p_member_number: memberNumber 
    });

  if (error) {
    console.error('Rate limit check error:', error);
    return false;
  }

  return data?.allowed ?? false;
}
