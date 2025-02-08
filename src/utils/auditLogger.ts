
import { supabase } from '@/integrations/supabase/client';

type AuditOperation = 'create' | 'update' | 'delete' | 'INSERT' | 'UPDATE' | 'DELETE' | 'approve' | 'reject';
type DatabaseOperation = 'create' | 'update' | 'delete' | 'INSERT' | 'UPDATE' | 'DELETE';
type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

interface AuditLogParams {
  operation: AuditOperation;
  tableName: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
  userId?: string;
}

function mapOperationToDatabase(operation: AuditOperation): DatabaseOperation {
  switch (operation) {
    case 'approve':
    case 'reject':
      return 'update';
    default:
      return operation as DatabaseOperation;
  }
}

export async function logAuditEvent({
  operation,
  tableName,
  recordId,
  oldValues,
  newValues,
  severity = 'info',
  metadata = {}
}: AuditLogParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // First try with metadata column
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          operation: mapOperationToDatabase(operation),
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues,
          new_values: newValues,
          severity,
          user_id: user?.id,
          metadata: {
            ...metadata,
            original_operation: operation,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });

      if (!error) return;
    } catch (error) {
      console.error('Failed to log audit event with metadata:', error);
    }

    // Fallback: try without metadata column
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        operation: mapOperationToDatabase(operation),
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues,
        severity,
        user_id: user?.id
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function getAuditLogs(tableName?: string, recordId?: string) {
  const query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (tableName) {
    query.eq('table_name', tableName);
  }

  if (recordId) {
    query.eq('record_id', recordId);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

