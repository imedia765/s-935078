
import { supabaseAdmin } from "./supabaseClient.ts";

export interface AuditEvent {
  operation: string;
  tableName: string;
  recordId?: string;
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      operation: event.operation,
      table_name: event.tableName,
      record_id: event.recordId,
      new_values: event.metadata,
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
