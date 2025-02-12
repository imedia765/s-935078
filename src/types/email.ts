
export type EmailPriority = 'critical' | 'high' | 'normal' | 'low' | 'bulk';

export interface EmailMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  recorded_at: string;
  details: Record<string, any>;
}

export interface MonitoringRule {
  id: string;
  name: string;
  metric_name: string;
  threshold: number;
  operator: string;
  severity: string;
  notification_channels: string[];
  message_template: string;
  cooldown_minutes: number;
}

export interface SmtpHealth {
  status: 'healthy' | 'degraded' | 'failing';
  last_check: string;
  details: {
    success_rate: number;
    response_time: number;
    quota_remaining: number;
  };
}

export interface SmtpHealthCheck {
  id: string;
  configuration_id: string;
  status: 'healthy' | 'degraded' | 'failing';
  check_timestamp: string;
  response_time: number;
  success_rate: number;
  quota_remaining: number;
  bounce_rate: number;
  error_details: Record<string, any>;
  created_at: string;
  smtp_configurations?: {
    name: string;
    host: string;
  };
}

export interface DnsCheckResult {
  id: string;
  record_type: 'MX' | 'SPF' | 'DKIM' | 'DMARC';
  domain: string;
  status: 'success' | 'warning' | 'error';
  value: string | null;
  error_message: string | null;
  check_timestamp: string;
  last_success_at: string | null;
}

export interface EmailDeliveryMetric {
  id: string;
  metric_type: string;
  value: number;
  recorded_at: string;
  details: Record<string, any>;
  configuration_id: string;
}
