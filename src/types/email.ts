
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

export interface LoopsWebhookPayload {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced';
  data: {
    emailId: string;
    timestamp: string;
    recipient: string;
    templateId?: string;
    metadata?: Record<string, any>;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables?: Record<string, string>;
  version?: number;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

