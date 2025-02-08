
import { logAuditEvent } from "./auditLogger";
import { PaymentValidation } from "./financialValidation";
import { supabase } from "@/integrations/supabase/client";

export async function logFinancialEvent(
  operation: 'create' | 'update' | 'delete' | 'approve' | 'reject',
  paymentData: Partial<PaymentValidation>,
  metadata: Record<string, any> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const enrichedMetadata = {
      ...metadata,
      amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      payment_type: paymentData.payment_type,
      member_number: paymentData.member_number,
      timestamp: new Date().toISOString(),
      ip_address: window.location.hostname,
      user_agent: navigator.userAgent
    };

    await logAuditEvent({
      operation,
      tableName: 'payment_requests',
      severity: operation === 'delete' ? 'warning' : 'info',
      metadata: enrichedMetadata,
      userId: user?.id
    });

    // For critical operations, also log to query_performance_logs
    if (['approve', 'reject', 'delete'].includes(operation)) {
      await supabase.from('query_performance_logs').insert({
        query_text: `Financial operation: ${operation}`,
        execution_time: 0,
        rows_affected: 1,
        query_stats: enrichedMetadata
      });
    }

  } catch (error) {
    console.error('Failed to log financial event:', error);
    // Still throw to ensure caller knows about the failure
    throw error;
  }
}

export async function validateFinancialAccess(
  operation: string,
  requiredRole: 'admin' | 'collector'
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', requiredRole);

    return roles && roles.length > 0;
  } catch (error) {
    console.error('Failed to validate financial access:', error);
    return false;
  }
}
