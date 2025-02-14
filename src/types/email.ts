
export interface EmailEvent {
  id: string;
  email_log_id: string | null;
  event_type: 'delivered' | 'opened' | 'clicked' | 'failed';
  occurred_at: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface EmailMetricData {
  date: string;
  delivered?: number;
  opened?: number;
  clicked?: number;
  failed?: number;
  total: number;
}
