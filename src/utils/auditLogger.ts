
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';

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

interface AuditActivityOptions {
  startDate?: Date;
  endDate?: Date;
  operation?: string;
  severity?: AuditSeverity;
}

function mapOperationToDatabase(operation: AuditOperation): DatabaseOperation {
  switch (operation) {
    case 'approve':
    case 'reject':
      return 'update';
    case 'INSERT':
      return 'create';
    case 'UPDATE':
      return 'update';
    case 'DELETE':
      return 'delete';
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
}: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
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

    if (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Failed to log audit event:', error);
    throw error;
  }
}

export async function getAuditLogs(tableName?: string, recordId?: string, options?: {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  try {
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

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options?.sortBy) {
      query.order(options.sortBy, { 
        ascending: options.sortOrder === 'asc'
      });
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

export function subscribeToAuditLogs(callback: (payload: any) => void) {
  const channel = supabase
    .channel('audit_logs_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'audit_logs'
      },
      (payload) => {
        console.log('Received audit log update:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getAuditActivitySummary(options?: AuditActivityOptions) {
  try {
    const { data, error } = await supabase.rpc('get_audit_activity_summary', {
      start_date: options?.startDate?.toISOString() || null,
      end_date: options?.endDate?.toISOString() || null,
      operation_filter: options?.operation || null,
      severity_filter: options?.severity || null
    }) as unknown as {
      data: Array<{
        hour_bucket: string;
        operation: string;
        count: number;
        severity: string;
        table_name: string;
        user_id: string;
      }> | null;
      error: Error | null;
    };

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching audit activity summary:', error);
    throw error;
  }
}
