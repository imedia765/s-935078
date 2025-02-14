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
          enabled?: boolean
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
          created_at: string
        }
        Insert: {
          id?: string
          metric_name: string
          current_value: number
          threshold: number
          severity: 'info' | 'warning' | 'critical'
          triggered_at?: string
          resolved_at?: string | null
          details?: {
            message: string
            timestamp: string
          }
          created_at?: string
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
          created_at?: string
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
      dns_check_results: {
        Row: {
          id: string
          record_type: 'MX' | 'SPF' | 'DKIM' | 'DMARC'
          domain: string
          status: 'success' | 'warning' | 'error'
          value: string | null
          error_message: string | null
          check_timestamp: string
          last_success_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          record_type: 'MX' | 'SPF' | 'DKIM' | 'DMARC'
          domain: string
          status: 'success' | 'warning' | 'error'
          value?: string | null
          error_message?: string | null
          check_timestamp?: string
          last_success_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          record_type?: 'MX' | 'SPF' | 'DKIM' | 'DMARC'
          domain?: string
          status?: 'success' | 'warning' | 'error'
          value?: string | null
          error_message?: string | null
          check_timestamp?: string
          last_success_at?: string | null
          created_at?: string
        }
      }
      email_transitions: {
        Row: {
          id: string
          member_number: string
          old_auth_email: string
          new_profile_email: string
          verification_token: string | null
          verification_sent_at: string | null
          verification_expires_at: string | null
          status: 'pending' | 'verifying' | 'completed' | 'failed'
          completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_number: string
          old_auth_email: string
          new_profile_email: string
          verification_token?: string | null
          verification_sent_at?: string | null
          verification_expires_at?: string | null
          status?: 'pending' | 'verifying' | 'completed' | 'failed'
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_number?: string
          old_auth_email?: string
          new_profile_email?: string
          verification_token?: string | null
          verification_sent_at?: string | null
          verification_expires_at?: string | null
          status?: 'pending' | 'verifying' | 'completed' | 'failed'
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_events: {
        Row: {
          id: string;
          email_log_id: string | null;
          event_type: 'delivered' | 'opened' | 'clicked' | 'failed';
          occurred_at: string;
          metadata: Record<string, any>;
          created_at: string;
        }
        Insert: {
          id?: string;
          email_log_id?: string | null;
          event_type: 'delivered' | 'opened' | 'clicked' | 'failed';
          occurred_at?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        }
        Update: {
          id?: string;
          email_log_id?: string | null;
          event_type?: 'delivered' | 'opened' | 'clicked' | 'failed';
          occurred_at?: string;
          metadata?: Record<string, any>;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "email_events_email_log_id_fkey"
            columns: ["email_log_id"]
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      initiate_email_transition: {
        Args: {
          p_member_number: string
          p_new_email: string
        }
        Returns: {
          success: boolean
          error?: string
          token?: string
        }
      }
      complete_email_transition: {
        Args: {
          p_token: string
        }
        Returns: {
          success: boolean
          error?: string
        }
      }
    }
  }
}
