
export interface Database {
  public: {
    Tables: {
      monitoring_alert_configs: {
        Row: {
          id: string
          metric_name: string
          threshold: number
          severity: 'info' | 'warning' | 'critical'
          enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          metric_name: string
          threshold: number
          severity: 'info' | 'warning' | 'critical'
          enabled: boolean
          created_at?: string
        }
        Update: {
          id?: string
          metric_name?: string
          threshold?: number
          severity?: 'info' | 'warning' | 'critical'
          enabled?: boolean
          created_at?: string
        }
      }
      active_alerts: {
        Row: {
          id: string
          metric_name: string
          current_value: number
          threshold: number
          severity: 'info' | 'warning' | 'critical'
          triggered_at: string
          resolved_at: string | null
          details: {
            message: string
            timestamp: string
          }
        }
        Insert: {
          id?: string
          metric_name: string
          current_value: number
          threshold: number
          severity: 'info' | 'warning' | 'critical'
          triggered_at?: string
          resolved_at?: string | null
          details: {
            message: string
            timestamp: string
          }
        }
        Update: {
          metric_name?: string
          current_value?: number
          threshold?: number
          severity?: 'info' | 'warning' | 'critical'
          triggered_at?: string
          resolved_at?: string | null
          details?: {
            message: string
            timestamp: string
          }
        }
      }
    }
  }
}
