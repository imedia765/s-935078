export interface MaintenanceHistory {
  execution_time: string;
  status: string;
  duration_seconds: number;
  details: Record<string, any>;
}

export interface BackupRecord {
  id: string;
  created_at: string;
  size: string;
  status: string;
}

export interface ErrorLog {
  timestamp: string;
  severity: string;
  message: string;
  source: string;
}

export interface PerformanceMetrics {
  response_times: Array<{ timestamp: string; value: number }>;
  query_times: Array<{ timestamp: string; value: number }>;
  api_performance: Array<{ timestamp: string; value: number }>;
  cache_hits: Array<{ timestamp: string; value: number }>;
}

export interface SecurityMetrics {
  failed_logins: number;
  security_alerts: number;
  ssl_expiry: string;
  ssl_days_remaining: number;
  active_sessions: number;
  vulnerabilities: Array<{ description: string; severity: string }>;
}

export interface SystemResources {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_status: string;
}