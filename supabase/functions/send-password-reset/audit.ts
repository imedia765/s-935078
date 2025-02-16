
import { supabaseAdmin } from "./supabaseClient.ts";

type AuditOperationType = 'create' | 'update' | 'delete' | 'INSERT' | 'UPDATE' | 'DELETE' | 'email_update' | 'email_verify' | 'email_reset';

export interface AuditEvent {
  operation: AuditOperationType;
  tableName: string;
  recordId?: string;
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    console.log('Logging audit event:', { ...event, metadata: { ...event.metadata, timestamp: new Date().toISOString() } });

    const { error } = await supabaseAdmin.from('audit_logs').insert({
      operation: event.operation,
      table_name: event.tableName,
      record_id: event.recordId,
      metadata: {
        ...event.metadata,
        timestamp: new Date().toISOString()
      },
      severity: event.severity
    });

    if (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw the error to prevent disrupting the main flow
  }
}
