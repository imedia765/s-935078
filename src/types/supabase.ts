
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
      smtp_health_checks: {
        Row: {
          id: string
          configuration_id: string
          status: 'healthy' | 'degraded' | 'failing'
          check_timestamp: string
          response_time: number
          success_rate: number
          quota_remaining: number
          error_details: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          configuration_id: string
          status: 'healthy' | 'degraded' | 'failing'
          check_timestamp: string
          response_time: number
          success_rate: number
          quota_remaining: number
          error_details?: Record<string, any>
          created_at?: string
        }
        Update: {
          configuration_id?: string
          status?: 'healthy' | 'degraded' | 'failing'
          check_timestamp?: string
          response_time?: number
          success_rate?: number
          quota_remaining?: number
          error_details?: Record<string, any>
          created_at?: string
        }
      }
      smtp_configurations: {
        Row: {
          id: string
          name: string
          host: string
        }
        Insert: {
          id?: string
          name: string
          host: string
        }
        Update: {
          name?: string
          host?: string
        }
      }
      payment_requests: {
        Row: {
          id: string
          amount: number
          payment_method: 'bank_transfer' | 'cash'
          payment_type: string
          status: string
          created_at: string
          payment_number: string
          collector_id?: string
          member_id?: string
          member_number?: string
          notes?: string
          approved_at?: string
          approved_by?: string
          due_date?: string
          has_supporting_docs?: boolean
          receipt_metadata?: Record<string, any>
        }
        Insert: {
          id?: string
          amount: number
          payment_method: 'bank_transfer' | 'cash'
          payment_type: string
          status: string
          created_at?: string
          payment_number: string
          collector_id?: string
          member_id?: string
          member_number?: string
          notes?: string
          approved_at?: string
          approved_by?: string
          due_date?: string
          has_supporting_docs?: boolean
          receipt_metadata?: Record<string, any>
        }
        Update: {
          amount?: number
          payment_method?: 'bank_transfer' | 'cash'
          payment_type?: string
          status?: string
          payment_number?: string
          collector_id?: string
          member_id?: string
          member_number?: string
          notes?: string
          approved_at?: string
          approved_by?: string
          due_date?: string
          has_supporting_docs?: boolean
          receipt_metadata?: Record<string, any>
        }
      }
    }
  }
}
