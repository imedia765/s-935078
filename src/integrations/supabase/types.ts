export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      active_alerts: {
        Row: {
          created_at: string | null
          current_value: number
          details: Json | null
          id: string
          metric_name: string
          resolved_at: string | null
          severity: string | null
          threshold: number
          triggered_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value: number
          details?: Json | null
          id?: string
          metric_name: string
          resolved_at?: string | null
          severity?: string | null
          threshold: number
          triggered_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number
          details?: Json | null
          id?: string
          metric_name?: string
          resolved_at?: string | null
          severity?: string | null
          threshold?: number
          triggered_at?: string | null
        }
        Relationships: []
      }
      archive_settings: {
        Row: {
          archive_criteria: Json | null
          auto_archive_enabled: boolean | null
          created_at: string | null
          id: string
          last_archive_run: string | null
          notification_emails: Json | null
          retention_period_days: number
          updated_at: string | null
        }
        Insert: {
          archive_criteria?: Json | null
          auto_archive_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_archive_run?: string | null
          notification_emails?: Json | null
          retention_period_days?: number
          updated_at?: string | null
        }
        Update: {
          archive_criteria?: Json | null
          auto_archive_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_archive_run?: string | null
          notification_emails?: Json | null
          retention_period_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_analytics: {
        Row: {
          analysis_date: string
          anomaly_detections: Json | null
          created_at: string | null
          id: string
          trending_activities: Json | null
          user_action_summary: Json
        }
        Insert: {
          analysis_date: string
          anomaly_detections?: Json | null
          created_at?: string | null
          id?: string
          trending_activities?: Json | null
          user_action_summary: Json
        }
        Update: {
          analysis_date?: string
          anomaly_detections?: Json | null
          created_at?: string | null
          id?: string
          trending_activities?: Json | null
          user_action_summary?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          anomaly_score: number | null
          category: string | null
          compressed: boolean | null
          id: string
          impact_level: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          operation: Database["public"]["Enums"]["audit_operation"]
          record_id: string | null
          related_entities: Json | null
          severity: Database["public"]["Enums"]["severity_level"] | null
          table_name: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          anomaly_score?: number | null
          category?: string | null
          compressed?: boolean | null
          id?: string
          impact_level?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          operation: Database["public"]["Enums"]["audit_operation"]
          record_id?: string | null
          related_entities?: Json | null
          severity?: Database["public"]["Enums"]["severity_level"] | null
          table_name: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          anomaly_score?: number | null
          category?: string | null
          compressed?: boolean | null
          id?: string
          impact_level?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: Database["public"]["Enums"]["audit_operation"]
          record_id?: string | null
          related_entities?: Json | null
          severity?: Database["public"]["Enums"]["severity_level"] | null
          table_name?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_report_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          last_generated: string | null
          name: string
          report_type: string
          template_config: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_generated?: string | null
          name: string
          report_type: string
          template_config: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_generated?: string | null
          name?: string
          report_type?: string
          template_config?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      auth_audit: {
        Row: {
          auth_email: string | null
          auth_user_id: string
          created_at: string | null
          id: string
          member_number: string
        }
        Insert: {
          auth_email?: string | null
          auth_user_id: string
          created_at?: string | null
          id?: string
          member_number: string
        }
        Update: {
          auth_email?: string | null
          auth_user_id?: string
          created_at?: string | null
          id?: string
          member_number?: string
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_file_name: string | null
          collectors_count: number | null
          error_message: string | null
          id: string
          members_count: number | null
          operation_type: Database["public"]["Enums"]["backup_operation_type"]
          performed_at: string | null
          performed_by: string | null
          policies_count: number | null
          roles_count: number | null
          status: string | null
        }
        Insert: {
          backup_file_name?: string | null
          collectors_count?: number | null
          error_message?: string | null
          id?: string
          members_count?: number | null
          operation_type: Database["public"]["Enums"]["backup_operation_type"]
          performed_at?: string | null
          performed_by?: string | null
          policies_count?: number | null
          roles_count?: number | null
          status?: string | null
        }
        Update: {
          backup_file_name?: string | null
          collectors_count?: number | null
          error_message?: string | null
          id?: string
          members_count?: number | null
          operation_type?: Database["public"]["Enums"]["backup_operation_type"]
          performed_at?: string | null
          performed_by?: string | null
          policies_count?: number | null
          roles_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
      backup_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          cron_expression: string
          frequency: string | null
          id: string
          last_run: string | null
          next_run: string | null
          retention_days: number | null
          schedule_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cron_expression: string
          frequency?: string | null
          id?: string
          last_run?: string | null
          next_run?: string | null
          retention_days?: number | null
          schedule_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cron_expression?: string
          frequency?: string | null
          id?: string
          last_run?: string | null
          next_run?: string | null
          retention_days?: number | null
          schedule_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      collector_role_fix_log: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          member_number: string
          status: Database["public"]["Enums"]["collector_role_status"] | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          member_number: string
          status?: Database["public"]["Enums"]["collector_role_status"] | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          member_number?: string
          status?: Database["public"]["Enums"]["collector_role_status"] | null
        }
        Relationships: []
      }
      database_health_metrics: {
        Row: {
          details: Json | null
          id: string
          metric_name: string
          metric_value: number | null
          recorded_at: string | null
          status: Database["public"]["Enums"]["health_status"] | null
        }
        Insert: {
          details?: Json | null
          id?: string
          metric_name: string
          metric_value?: number | null
          recorded_at?: string | null
          status?: Database["public"]["Enums"]["health_status"] | null
        }
        Update: {
          details?: Json | null
          id?: string
          metric_name?: string
          metric_value?: number | null
          recorded_at?: string | null
          status?: Database["public"]["Enums"]["health_status"] | null
        }
        Relationships: []
      }
      deleted_members: {
        Row: {
          deleted_at: string | null
          deleted_by: string | null
          id: string
          member_data: Json
          restored_at: string | null
          restored_by: string | null
        }
        Insert: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          member_data: Json
          restored_at?: string | null
          restored_by?: string | null
        }
        Update: {
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          member_data?: Json
          restored_at?: string | null
          restored_by?: string | null
        }
        Relationships: []
      }
      documentation: {
        Row: {
          created_at: string
          created_by: string | null
          file_path: string
          id: string
          is_current: boolean | null
          metadata: Json | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_path: string
          id?: string
          is_current?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_path?: string
          id?: string
          is_current?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      documentation_sections: {
        Row: {
          content: string
          created_at: string | null
          id: string
          section_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          section_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          section_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_audit: {
        Row: {
          auth_email: string | null
          auth_user_id: string | null
          created_at: string | null
          id: string
          member_email: string | null
          member_number: string | null
          metadata: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auth_email?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          member_email?: string | null
          member_number?: string | null
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_email?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          member_email?: string | null
          member_number?: string | null
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_audit_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "email_sync_status"
            referencedColumns: ["member_number"]
          },
          {
            foreignKeyName: "email_audit_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["member_number"]
          },
        ]
      }
      email_audit_backup: {
        Row: {
          auth_email: string | null
          auth_user_id: string | null
          created_at: string | null
          id: string | null
          member_email: string | null
          member_number: string | null
          metadata: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auth_email?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          id?: string | null
          member_email?: string | null
          member_number?: string | null
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_email?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          id?: string | null
          member_email?: string | null
          member_number?: string | null
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string | null
          email_log_id: string | null
          event_type: string | null
          id: string
          metadata: Json | null
          occurred_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_log_id?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_log_id?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounce_type: string | null
          created_at: string
          daily_counter: number | null
          delivered_at: string | null
          delivery_meta: Json | null
          email_category: string | null
          email_type: Database["public"]["Enums"]["email_type"]
          error_message: string | null
          id: string
          member_number: string | null
          metadata: Json | null
          next_retry_at: string | null
          priority: string | null
          processing_duration: unknown | null
          queued_for_date: string | null
          recipient_email: string
          resend_id: string | null
          retry_count: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          bounce_type?: string | null
          created_at?: string
          daily_counter?: number | null
          delivered_at?: string | null
          delivery_meta?: Json | null
          email_category?: string | null
          email_type: Database["public"]["Enums"]["email_type"]
          error_message?: string | null
          id?: string
          member_number?: string | null
          metadata?: Json | null
          next_retry_at?: string | null
          priority?: string | null
          processing_duration?: unknown | null
          queued_for_date?: string | null
          recipient_email: string
          resend_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          bounce_type?: string | null
          created_at?: string
          daily_counter?: number | null
          delivered_at?: string | null
          delivery_meta?: Json | null
          email_category?: string | null
          email_type?: Database["public"]["Enums"]["email_type"]
          error_message?: string | null
          id?: string
          member_number?: string | null
          metadata?: Json | null
          next_retry_at?: string | null
          priority?: string | null
          processing_duration?: unknown | null
          queued_for_date?: string | null
          recipient_email?: string
          resend_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "email_sync_status"
            referencedColumns: ["member_number"]
          },
          {
            foreignKeyName: "email_logs_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["member_number"]
          },
        ]
      }
      email_metrics: {
        Row: {
          details: Json | null
          id: string
          metric_name: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          details?: Json | null
          id?: string
          metric_name: string
          metric_value: number
          recorded_at?: string
        }
        Update: {
          details?: Json | null
          id?: string
          metric_name?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      email_migration_backup: {
        Row: {
          id: string
          member_number: string
          migrated_at: string | null
          original_auth_email: string | null
          original_email: string | null
          restored_at: string | null
        }
        Insert: {
          id?: string
          member_number: string
          migrated_at?: string | null
          original_auth_email?: string | null
          original_email?: string | null
          restored_at?: string | null
        }
        Update: {
          id?: string
          member_number?: string
          migrated_at?: string | null
          original_auth_email?: string | null
          original_email?: string | null
          restored_at?: string | null
        }
        Relationships: []
      }
      email_migration_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          member_number: string
          new_value: Json | null
          old_value: Json | null
          operation: string
          success: boolean | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          member_number: string
          new_value?: Json | null
          old_value?: Json | null
          operation: string
          success?: boolean | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          member_number?: string
          new_value?: Json | null
          old_value?: Json | null
          operation?: string
          success?: boolean | null
        }
        Relationships: []
      }
      email_monitoring_rules: {
        Row: {
          cooldown_minutes: number | null
          created_at: string
          id: string
          message_template: string | null
          metric_name: string
          name: string
          notification_channels: Json | null
          operator: string
          severity: string
          threshold: number
          updated_at: string
        }
        Insert: {
          cooldown_minutes?: number | null
          created_at?: string
          id?: string
          message_template?: string | null
          metric_name: string
          name: string
          notification_channels?: Json | null
          operator: string
          severity: string
          threshold: number
          updated_at?: string
        }
        Update: {
          cooldown_minutes?: number | null
          created_at?: string
          id?: string
          message_template?: string | null
          metric_name?: string
          name?: string
          notification_channels?: Json | null
          operator?: string
          severity?: string
          threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_provider_audit: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          provider: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          provider: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          provider?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_queue_config: {
        Row: {
          auto_process_interval: number
          category: string
          created_at: string | null
          daily_limit: number
          id: string
          updated_at: string | null
        }
        Insert: {
          auto_process_interval?: number
          category: string
          created_at?: string | null
          daily_limit?: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          auto_process_interval?: number
          category?: string
          created_at?: string | null
          daily_limit?: number
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_standardization_logs: {
        Row: {
          attempted_at: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          member_number: string
          metadata: Json | null
          new_email: string | null
          old_email: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          member_number: string
          metadata?: Json | null
          new_email?: string | null
          old_email?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          attempted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          member_number?: string
          metadata?: Json | null
          new_email?: string | null
          old_email?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_standardization_results: {
        Row: {
          member_number: string | null
          new_email: string | null
          old_email: string | null
          status: string | null
        }
        Insert: {
          member_number?: string | null
          new_email?: string | null
          old_email?: string | null
          status?: string | null
        }
        Update: {
          member_number?: string | null
          new_email?: string | null
          old_email?: string | null
          status?: string | null
        }
        Relationships: []
      }
      email_sync_tracking: {
        Row: {
          auth_email: string | null
          auth_user_id: string | null
          created_at: string | null
          id: string
          member_email: string | null
          member_number: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          auth_email?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          member_email?: string | null
          member_number?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_email?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          member_email?: string | null
          member_number?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sync_tracking_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "email_sync_status"
            referencedColumns: ["member_number"]
          },
          {
            foreignKeyName: "email_sync_tracking_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["member_number"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["email_template_category"]
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          is_system: boolean
          name: string
          subject: string
          updated_at: string
          variables: Json | null
          version: number | null
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["email_template_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean
          name: string
          subject: string
          updated_at?: string
          variables?: Json | null
          version?: number | null
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["email_template_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean
          name?: string
          subject?: string
          updated_at?: string
          variables?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      email_transitions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          member_number: string
          new_profile_email: string
          old_auth_email: string
          status: string
          updated_at: string
          verification_expires_at: string | null
          verification_sent_at: string | null
          verification_token: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          member_number: string
          new_profile_email: string
          old_auth_email: string
          status?: string
          updated_at?: string
          verification_expires_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          member_number?: string
          new_profile_email?: string
          old_auth_email?: string
          status?: string
          updated_at?: string
          verification_expires_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      email_whitelist: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email: string
          id: string
          member_number: string
          reason: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email: string
          id?: string
          member_number: string
          reason?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          member_number?: string
          reason?: string | null
        }
        Relationships: []
      }
      email_whitelist_logs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email: string
          id: string
          member_number: string
          metadata: Json | null
          reason: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email: string
          id?: string
          member_number: string
          metadata?: Json | null
          reason: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          member_number?: string
          metadata?: Json | null
          reason?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enhanced_roles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_updated_at: string | null
          role_name: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          role_name: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          role_name?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_details: string | null
          error_message: string
          function_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          error_details?: string | null
          error_message: string
          function_name?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          error_details?: string | null
          error_message?: string
          function_name?: string | null
          id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          family_member_number: string
          full_name: string
          gender: string | null
          id: string
          member_id: string
          relationship: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          family_member_number: string
          full_name: string
          gender?: string | null
          id?: string
          member_id: string
          relationship: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          family_member_number?: string
          full_name?: string
          gender?: string | null
          id?: string
          member_id?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      file_retention_logs: {
        Row: {
          deleted_at: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          reason: string
        }
        Insert: {
          deleted_at?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          reason: string
        }
        Update: {
          deleted_at?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          reason?: string
        }
        Relationships: []
      }
      file_retention_policies: {
        Row: {
          created_at: string | null
          file_type: string
          id: string
          retention_days: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_type: string
          id?: string
          retention_days: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string
          id?: string
          retention_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      git_repositories: {
        Row: {
          branch: string
          created_at: string | null
          created_by: string | null
          custom_url: string | null
          id: string
          is_master: boolean
          last_sync_at: string | null
          name: string
          source_url: string
          status: string | null
          target_url: string | null
        }
        Insert: {
          branch?: string
          created_at?: string | null
          created_by?: string | null
          custom_url?: string | null
          id?: string
          is_master?: boolean
          last_sync_at?: string | null
          name: string
          source_url: string
          status?: string | null
          target_url?: string | null
        }
        Update: {
          branch?: string
          created_at?: string | null
          created_by?: string | null
          custom_url?: string | null
          id?: string
          is_master?: boolean
          last_sync_at?: string | null
          name?: string
          source_url?: string
          status?: string | null
          target_url?: string | null
        }
        Relationships: []
      }
      git_sync_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          error_details: string | null
          id: string
          message: string | null
          operation_type: string
          repository_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          error_details?: string | null
          id?: string
          message?: string | null
          operation_type: string
          repository_id?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          error_details?: string | null
          id?: string
          message?: string | null
          operation_type?: string
          repository_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "git_sync_logs_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "git_repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      integrity_check_results: {
        Row: {
          check_type: string
          checked_at: string | null
          details: Json | null
          id: string
          issue_count: number | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          table_name: string | null
        }
        Insert: {
          check_type: string
          checked_at?: string | null
          details?: Json | null
          id?: string
          issue_count?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          table_name?: string | null
        }
        Update: {
          check_type?: string
          checked_at?: string | null
          details?: Json | null
          id?: string
          issue_count?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          table_name?: string | null
        }
        Relationships: []
      }
      login_attempt_tracking: {
        Row: {
          actual_email: string | null
          attempted_email: string | null
          created_at: string | null
          error_details: Json | null
          id: string
          ip_address: string | null
          member_number: string
          status: string
          user_agent: string | null
        }
        Insert: {
          actual_email?: string | null
          attempted_email?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          ip_address?: string | null
          member_number: string
          status: string
          user_agent?: string | null
        }
        Update: {
          actual_email?: string | null
          attempted_email?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          ip_address?: string | null
          member_number?: string
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      login_patterns: {
        Row: {
          created_at: string | null
          failure_count: number | null
          id: string
          last_failure_at: string | null
          last_success_at: string | null
          member_number: string | null
          pattern_data: Json | null
          success_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          member_number?: string | null
          pattern_data?: Json | null
          success_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          failure_count?: number | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          member_number?: string | null
          pattern_data?: Json | null
          success_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      loops_integration: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          is_active: boolean | null
          late_payment_template_id: string | null
          password_reset_template_id: string | null
          payment_confirmation_template_id: string | null
          payment_reminder_template_id: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          late_payment_template_id?: string | null
          password_reset_template_id?: string | null
          payment_confirmation_template_id?: string | null
          payment_reminder_template_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          late_payment_template_id?: string | null
          password_reset_template_id?: string | null
          payment_confirmation_template_id?: string | null
          payment_reminder_template_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_settings: {
        Row: {
          created_at: string | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
          is_enabled: boolean | null
          message: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean | null
          message?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean | null
          message?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      member_notes: {
        Row: {
          created_at: string
          id: string
          member_id: string
          note_text: string
          note_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          note_text: string
          note_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          note_text?: string
          note_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          admin_note: string | null
          auth_user_id: string | null
          collector: string | null
          collector_id: string | null
          cors_enabled: boolean | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          email_verified: boolean | null
          emergency_collection_amount: number | null
          emergency_collection_created_at: string | null
          emergency_collection_due_date: string | null
          emergency_collection_status: string | null
          failed_login_attempts: number | null
          family_member_dob: string | null
          family_member_gender: string | null
          family_member_name: string | null
          family_member_relationship: string | null
          full_name: string
          gender: string | null
          id: string
          last_failed_attempt: string | null
          locked_until: string | null
          marital_status: string | null
          member_number: string
          membership_type: string | null
          password_reset_required: boolean | null
          password_set_at: string | null
          payment_amount: number | null
          payment_date: string | null
          payment_notes: string | null
          payment_type: string | null
          phone: string | null
          photo_url: string | null
          postcode: string | null
          status: string | null
          ticket_description: string | null
          ticket_priority: string | null
          ticket_status: string | null
          ticket_subject: string | null
          town: string | null
          updated_at: string
          verified: boolean | null
          yearly_payment_amount: number | null
          yearly_payment_due_date: string | null
          yearly_payment_status: string | null
        }
        Insert: {
          address?: string | null
          admin_note?: string | null
          auth_user_id?: string | null
          collector?: string | null
          collector_id?: string | null
          cors_enabled?: boolean | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          emergency_collection_amount?: number | null
          emergency_collection_created_at?: string | null
          emergency_collection_due_date?: string | null
          emergency_collection_status?: string | null
          failed_login_attempts?: number | null
          family_member_dob?: string | null
          family_member_gender?: string | null
          family_member_name?: string | null
          family_member_relationship?: string | null
          full_name: string
          gender?: string | null
          id?: string
          last_failed_attempt?: string | null
          locked_until?: string | null
          marital_status?: string | null
          member_number: string
          membership_type?: string | null
          password_reset_required?: boolean | null
          password_set_at?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_notes?: string | null
          payment_type?: string | null
          phone?: string | null
          photo_url?: string | null
          postcode?: string | null
          status?: string | null
          ticket_description?: string | null
          ticket_priority?: string | null
          ticket_status?: string | null
          ticket_subject?: string | null
          town?: string | null
          updated_at?: string
          verified?: boolean | null
          yearly_payment_amount?: number | null
          yearly_payment_due_date?: string | null
          yearly_payment_status?: string | null
        }
        Update: {
          address?: string | null
          admin_note?: string | null
          auth_user_id?: string | null
          collector?: string | null
          collector_id?: string | null
          cors_enabled?: boolean | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          emergency_collection_amount?: number | null
          emergency_collection_created_at?: string | null
          emergency_collection_due_date?: string | null
          emergency_collection_status?: string | null
          failed_login_attempts?: number | null
          family_member_dob?: string | null
          family_member_gender?: string | null
          family_member_name?: string | null
          family_member_relationship?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          last_failed_attempt?: string | null
          locked_until?: string | null
          marital_status?: string | null
          member_number?: string
          membership_type?: string | null
          password_reset_required?: boolean | null
          password_set_at?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_notes?: string | null
          payment_type?: string | null
          phone?: string | null
          photo_url?: string | null
          postcode?: string | null
          status?: string | null
          ticket_description?: string | null
          ticket_priority?: string | null
          ticket_status?: string | null
          ticket_subject?: string | null
          town?: string | null
          updated_at?: string
          verified?: boolean | null
          yearly_payment_amount?: number | null
          yearly_payment_due_date?: string | null
          yearly_payment_status?: string | null
        }
        Relationships: []
      }
      members_collectors: {
        Row: {
          active: boolean | null
          auth_user_id: string | null
          created_at: string
          email: string | null
          id: string
          member_number: string | null
          name: string | null
          number: string | null
          phone: string | null
          prefix: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          member_number?: string | null
          name?: string | null
          number?: string | null
          phone?: string | null
          prefix?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          member_number?: string | null
          name?: string | null
          number?: string | null
          phone?: string | null
          prefix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_collectors_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: true
            referencedRelation: "email_sync_status"
            referencedColumns: ["member_number"]
          },
          {
            foreignKeyName: "members_collectors_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["member_number"]
          },
        ]
      }
      monitoring_alert_configs: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          metric_name: string
          severity: string | null
          threshold: number
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          metric_name: string
          severity?: string | null
          threshold: number
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          metric_name?: string
          severity?: string | null
          threshold?: number
        }
        Relationships: []
      }
      monitoring_logs: {
        Row: {
          details: Json | null
          event_type: Database["public"]["Enums"]["monitoring_event_type"]
          id: string
          metric_name: string
          metric_value: number
          severity: Database["public"]["Enums"]["severity_level"] | null
          timestamp: string | null
        }
        Insert: {
          details?: Json | null
          event_type: Database["public"]["Enums"]["monitoring_event_type"]
          id?: string
          metric_name: string
          metric_value: number
          severity?: Database["public"]["Enums"]["severity_level"] | null
          timestamp?: string | null
        }
        Update: {
          details?: Json | null
          event_type?: Database["public"]["Enums"]["monitoring_event_type"]
          id?: string
          metric_name?: string
          metric_value?: number
          severity?: Database["public"]["Enums"]["severity_level"] | null
          timestamp?: string | null
        }
        Relationships: []
      }
      password_change_logs: {
        Row: {
          action: string | null
          changed_at: string | null
          changed_by: string | null
          client_info: Json | null
          error_code: string | null
          error_details: string | null
          error_message: string | null
          execution_context: Json | null
          id: string
          ip_address: string | null
          is_reset: boolean | null
          reason: string | null
          stack_trace: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          changed_at?: string | null
          changed_by?: string | null
          client_info?: Json | null
          error_code?: string | null
          error_details?: string | null
          error_message?: string | null
          execution_context?: Json | null
          id?: string
          ip_address?: string | null
          is_reset?: boolean | null
          reason?: string | null
          stack_trace?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          changed_at?: string | null
          changed_by?: string | null
          client_info?: Json | null
          error_code?: string | null
          error_details?: string | null
          error_message?: string | null
          execution_context?: Json | null
          id?: string
          ip_address?: string | null
          is_reset?: boolean | null
          reason?: string | null
          stack_trace?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      password_config: {
        Row: {
          created_at: string | null
          id: string
          lockout_duration: unknown | null
          max_attempts: number | null
          min_length: number | null
          require_lowercase: boolean | null
          require_number: boolean | null
          require_special: boolean | null
          require_uppercase: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lockout_duration?: unknown | null
          max_attempts?: number | null
          min_length?: number | null
          require_lowercase?: boolean | null
          require_number?: boolean | null
          require_special?: boolean | null
          require_uppercase?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lockout_duration?: unknown | null
          max_attempts?: number | null
          min_length?: number | null
          require_lowercase?: boolean | null
          require_number?: boolean | null
          require_special?: boolean | null
          require_uppercase?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      password_reset_email_transitions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          member_number: string
          metadata: Json | null
          new_email: string
          old_email: string
          status: string
          transition_type: string
          verification_token: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          member_number: string
          metadata?: Json | null
          new_email: string
          old_email: string
          status?: string
          transition_type: string
          verification_token?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          member_number?: string
          metadata?: Json | null
          new_email?: string
          old_email?: string
          status?: string
          transition_type?: string
          verification_token?: string | null
        }
        Relationships: []
      }
      password_reset_rate_limits: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          ip_address: string
          last_attempt: string | null
          locked_until: string | null
          member_number: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          ip_address: string
          last_attempt?: string | null
          locked_until?: string | null
          member_number: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string
          last_attempt?: string | null
          locked_until?: string | null
          member_number?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          invalidated_at: string | null
          member_number: string
          token: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          invalidated_at?: string | null
          member_number: string
          token: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          invalidated_at?: string | null
          member_number?: string
          token?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      password_reset_transitions: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          member_number: string
          metadata: Json | null
          new_email: string | null
          old_email: string
          reset_expires_at: string | null
          reset_sent_at: string | null
          reset_token: string | null
          status:
            | Database["public"]["Enums"]["email_verification_status"]
            | null
          updated_at: string
          user_agent: string | null
          verification_expires_at: string | null
          verification_sent_at: string | null
          verification_token: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          member_number: string
          metadata?: Json | null
          new_email?: string | null
          old_email: string
          reset_expires_at?: string | null
          reset_sent_at?: string | null
          reset_token?: string | null
          status?:
            | Database["public"]["Enums"]["email_verification_status"]
            | null
          updated_at?: string
          user_agent?: string | null
          verification_expires_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          member_number?: string
          metadata?: Json | null
          new_email?: string | null
          old_email?: string
          reset_expires_at?: string | null
          reset_sent_at?: string | null
          reset_token?: string | null
          status?:
            | Database["public"]["Enums"]["email_verification_status"]
            | null
          updated_at?: string
          user_agent?: string | null
          verification_expires_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      payment_analytics_summary: {
        Row: {
          calculated_at: string | null
          collector_breakdown: Json | null
          id: string
          payment_method_breakdown: Json | null
          period_end: string
          period_start: string
          status_breakdown: Json | null
          total_amount: number
          total_payments: number
        }
        Insert: {
          calculated_at?: string | null
          collector_breakdown?: Json | null
          id?: string
          payment_method_breakdown?: Json | null
          period_end: string
          period_start: string
          status_breakdown?: Json | null
          total_amount: number
          total_payments: number
        }
        Update: {
          calculated_at?: string | null
          collector_breakdown?: Json | null
          id?: string
          payment_method_breakdown?: Json | null
          period_end?: string
          period_start?: string
          status_breakdown?: Json | null
          total_amount?: number
          total_payments?: number
        }
        Relationships: []
      }
      payment_archives: {
        Row: {
          archived_at: string | null
          id: string
          payment_data: Json
        }
        Insert: {
          archived_at?: string | null
          id?: string
          payment_data: Json
        }
        Update: {
          archived_at?: string | null
          id?: string
          payment_data?: Json
        }
        Relationships: []
      }
      payment_audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_state: Json | null
          old_state: Json | null
          payment_id: string
          performed_at: string | null
          performed_by: string
          user_agent: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_state?: Json | null
          old_state?: Json | null
          payment_id: string
          performed_at?: string | null
          performed_by: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_state?: Json | null
          old_state?: Json | null
          payment_id?: string
          performed_at?: string | null
          performed_by?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_audit_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_receipts: {
        Row: {
          amount: number
          collector_name: string
          created_at: string | null
          email_log_id: string | null
          id: string
          member_name: string
          member_number: string
          payment_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_type: string
          receipt_number: string
          sent_at: string | null
          sent_to: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          collector_name: string
          created_at?: string | null
          email_log_id?: string | null
          id?: string
          member_name: string
          member_number: string
          payment_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_type: string
          receipt_number: string
          sent_at?: string | null
          sent_to: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          collector_name?: string
          created_at?: string | null
          email_log_id?: string | null
          id?: string
          member_name?: string
          member_number?: string
          payment_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_type?: string
          receipt_number?: string
          sent_at?: string | null
          sent_to?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "email_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "email_sync_status"
            referencedColumns: ["member_number"]
          },
          {
            foreignKeyName: "payment_receipts_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["member_number"]
          },
          {
            foreignKeyName: "payment_receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          member_id: string
          payment_type: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          member_id: string
          payment_type: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          member_id?: string
          payment_type?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          collector_id: string
          created_at: string | null
          has_supporting_docs: boolean | null
          id: string
          member_number: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_number: string | null
          payment_type: string
          receipt_metadata: Json | null
          retention_period: unknown | null
          status: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          collector_id: string
          created_at?: string | null
          has_supporting_docs?: boolean | null
          id?: string
          member_number: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_number?: string | null
          payment_type: string
          receipt_metadata?: Json | null
          retention_period?: unknown | null
          status?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          collector_id?: string
          created_at?: string | null
          has_supporting_docs?: boolean | null
          id?: string
          member_number?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_number?: string | null
          payment_type?: string
          receipt_metadata?: Json | null
          retention_period?: unknown | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "members_collectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "email_sync_status"
            referencedColumns: ["member_number"]
          },
          {
            foreignKeyName: "payment_requests_member_number_fkey"
            columns: ["member_number"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["member_number"]
          },
        ]
      }
      permission_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          permissions: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      query_performance_logs: {
        Row: {
          execution_plan: Json | null
          execution_time: number | null
          id: string
          query_hash: string | null
          query_stats: Json | null
          query_text: string | null
          recorded_at: string | null
          rows_affected: number | null
        }
        Insert: {
          execution_plan?: Json | null
          execution_time?: number | null
          id?: string
          query_hash?: string | null
          query_stats?: Json | null
          query_text?: string | null
          recorded_at?: string | null
          rows_affected?: number | null
        }
        Update: {
          execution_plan?: Json | null
          execution_time?: number | null
          id?: string
          query_hash?: string | null
          query_stats?: Json | null
          query_text?: string | null
          recorded_at?: string | null
          rows_affected?: number | null
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          attempt_count: number | null
          first_attempt_at: string | null
          id: string
          ip_address: string
          last_attempt_at: string | null
          locked_until: string | null
          metadata: Json | null
        }
        Insert: {
          attempt_count?: number | null
          first_attempt_at?: string | null
          id?: string
          ip_address: string
          last_attempt_at?: string | null
          locked_until?: string | null
          metadata?: Json | null
        }
        Update: {
          attempt_count?: number | null
          first_attempt_at?: string | null
          id?: string
          ip_address?: string
          last_attempt_at?: string | null
          locked_until?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      receipt_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_settings: Json | null
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_settings?: Json | null
          template_data: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_settings?: Json | null
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          receipt_number: string
          receipt_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          receipt_number: string
          receipt_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          receipt_number?: string
          receipt_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      role_change_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          existing_role: Database["public"]["Enums"]["app_role"] | null
          id: string
          permissions_data: Json | null
          reason: string | null
          requested_by: string | null
          requested_role: Database["public"]["Enums"]["app_role"] | null
          status: Database["public"]["Enums"]["approval_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          existing_role?: Database["public"]["Enums"]["app_role"] | null
          id?: string
          permissions_data?: Json | null
          reason?: string | null
          requested_by?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          existing_role?: Database["public"]["Enums"]["app_role"] | null
          id?: string
          permissions_data?: Json | null
          reason?: string | null
          requested_by?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      role_history: {
        Row: {
          change_type: string | null
          changed_by_user_id: string | null
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          role: Database["public"]["Enums"]["app_role"] | null
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          change_type?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          role?: Database["public"]["Enums"]["app_role"] | null
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          change_type?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          role?: Database["public"]["Enums"]["app_role"] | null
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          permission_name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          permission_name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          permission_name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      schema_versions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          changes: Json | null
          checksum: string | null
          description: string | null
          id: string
          is_current: boolean | null
          version_number: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          changes?: Json | null
          checksum?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          version_number: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          changes?: Json | null
          checksum?: string | null
          description?: string | null
          id?: string
          is_current?: boolean | null
          version_number?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          member_number: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          member_number?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          member_number?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: []
      }
      storage_metrics: {
        Row: {
          bloat_size: number | null
          dead_tuples: number | null
          id: string
          index_size: number | null
          last_analyze: string | null
          last_vacuum: string | null
          recorded_at: string | null
          table_name: string
          total_size: number | null
        }
        Insert: {
          bloat_size?: number | null
          dead_tuples?: number | null
          id?: string
          index_size?: number | null
          last_analyze?: string | null
          last_vacuum?: string | null
          recorded_at?: string | null
          table_name: string
          total_size?: number | null
        }
        Update: {
          bloat_size?: number | null
          dead_tuples?: number | null
          id?: string
          index_size?: number | null
          last_analyze?: string | null
          last_vacuum?: string | null
          recorded_at?: string | null
          table_name?: string
          total_size?: number | null
        }
        Relationships: []
      }
      storage_quotas: {
        Row: {
          bucket_name: string
          created_at: string | null
          id: string
          max_size_bytes: number
          updated_at: string | null
          warning_threshold_percent: number
        }
        Insert: {
          bucket_name: string
          created_at?: string | null
          id?: string
          max_size_bytes: number
          updated_at?: string | null
          warning_threshold_percent?: number
        }
        Update: {
          bucket_name?: string
          created_at?: string | null
          id?: string
          max_size_bytes?: number
          updated_at?: string | null
          warning_threshold_percent?: number
        }
        Relationships: []
      }
      supporting_documents: {
        Row: {
          document_type: string
          file_url: string
          id: string
          metadata: Json | null
          notes: string | null
          payment_id: string | null
          status: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          document_type: string
          file_url: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_id?: string | null
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          document_type?: string
          file_url?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_id?: string | null
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supporting_documents_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_status: {
        Row: {
          error_message: string | null
          id: string
          last_attempted_sync_at: string | null
          status: string | null
          store_error: string | null
          store_status: string | null
          sync_started_at: string | null
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          last_attempted_sync_at?: string | null
          status?: string | null
          store_error?: string | null
          store_status?: string | null
          sync_started_at?: string | null
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          last_attempted_sync_at?: string | null
          status?: string | null
          store_error?: string | null
          store_status?: string | null
          sync_started_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_announcements: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          priority: number | null
          severity: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          priority?: number | null
          severity?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          priority?: number | null
          severity?: string | null
          title?: string
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          category: string
          current_value: number | null
          details: Json | null
          id: string
          metric_name: string
          recorded_at: string | null
          status: string | null
          threshold: number | null
        }
        Insert: {
          category: string
          current_value?: number | null
          details?: Json | null
          id?: string
          metric_name: string
          recorded_at?: string | null
          status?: string | null
          threshold?: number | null
        }
        Update: {
          category?: string
          current_value?: number | null
          details?: Json | null
          id?: string
          metric_name?: string
          recorded_at?: string | null
          status?: string | null
          threshold?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      email_sync_status: {
        Row: {
          auth_email: string | null
          auth_user_id: string | null
          member_email: string | null
          member_number: string | null
          sync_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_role: {
        Args: {
          p_user_id: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      analyze_storage_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          total_size: number
          bloat_percentage: number
          recommendations: Json
        }[]
      }
      approve_role_change: {
        Args: {
          request_id: string
          new_status: string
          admin_id: string
        }
        Returns: Json
      }
      assign_collector_role: {
        Args: {
          member_id: string
          collector_name: string
          collector_prefix: string
          collector_number: string
        }
        Returns: string
      }
      audit_security_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          status: string
          details: Json
        }[]
      }
      calculate_email_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_access_during_maintenance: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      check_api_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          current_value: number
          threshold: number
          status: string
          details: Json
        }[]
      }
      check_auth_flow: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          status: string
          details: Json
        }[]
      }
      check_critical_logic: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          status: string
          details: Json
        }[]
      }
      check_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          status: string
          details: Json
        }[]
      }
      check_database_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          current_value: number
          status: Database["public"]["Enums"]["health_status"]
          details: Json
        }[]
      }
      check_email_attachment_size: {
        Args: {
          p_size_bytes: number
        }
        Returns: boolean
      }
      check_email_standardization: {
        Args: Record<PropertyKey, never>
        Returns: {
          member_number: string
          current_auth_email: string
          current_member_email: string
          standardization_status: string
          issues: string[]
        }[]
      }
      check_error_rates: {
        Args: Record<PropertyKey, never>
        Returns: {
          recorded_at: string
          severity: string
          source: string
        }[]
      }
      check_loops_config: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_api_key: boolean
          is_active: boolean
        }[]
      }
      check_member_numbers: {
        Args: Record<PropertyKey, never>
        Returns: {
          issue_type: string
          description: string
          affected_table: string
          member_number: string
          details: Json
        }[]
      }
      check_password_reset_rate_limit: {
        Args: {
          p_member_number: string
          p_ip_address: string
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_ip_address: string
          p_member_number?: string
        }
        Returns: Json
      }
      check_rbac: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          status: string
          details: Json
        }[]
      }
      check_resource_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          current_value: number
          threshold: number
          status: string
          details: Json
        }[]
      }
      check_smtp_dns: {
        Args: Record<PropertyKey, never>
        Returns: {
          smtp_host: string
          mx_records_exist: boolean
          spf_record_exists: boolean
          dkim_configured: boolean
          dmarc_configured: boolean
          last_checked: string
          details: Json
        }[]
      }
      check_storage_quota: {
        Args: {
          p_bucket_name: string
          p_file_size: number
        }
        Returns: boolean
      }
      check_system_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          current_value: number
          threshold: number
          status: string
          details: Json
        }[]
      }
      check_user_activity: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          current_value: number
          threshold: number
          status: string
          details: Json
        }[]
      }
      cleanup_expired_files: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_failed_attempts: {
        Args: {
          p_member_number: string
        }
        Returns: undefined
      }
      complete_email_transition: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      convert_member_number_to_uuid: {
        Args: {
          member_number: string
        }
        Returns: string
      }
      create_auth_user_for_collector: {
        Args: {
          member_num: string
        }
        Returns: string
      }
      create_auth_users_for_collectors: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_performance_recording_job: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      finalize_password_reset: {
        Args: {
          token_value: string
          ip_address: string
          user_agent: string
          client_info?: Json
        }
        Returns: Json
      }
      fix_all_role_issues: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_collector_role_sync: {
        Args: {
          p_member_number: string
        }
        Returns: Json
      }
      fix_role_error: {
        Args: {
          p_error_type: string
          p_user_id: string
          p_specific_fix?: string
        }
        Returns: Json
      }
      generate_family_member_number: {
        Args: {
          p_parent_member_number: string
          p_relationship: string
        }
        Returns: string
      }
      generate_full_backup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_magic_link:
        | {
            Args: {
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_user_id: string
            }
            Returns: Json
          }
      generate_payment_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_receipt_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_audit_activity_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          hour_bucket: string
          operation: string
          count: number
        }[]
      }
      get_collector_role_fix_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_processed: number
          successful: number
          failed: number
          failure_details: Json
        }[]
      }
      get_collectors_role_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          collector_name: string
          member_number: string
          contact_info: Json
          role_verification: Json
          auth_status: Json
          sync_status: Json
          last_sync: string
          enhanced_role_status: string
          role_store_status: string
          permissions: Json
        }[]
      }
      get_connection_pool_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          current_value: number
          details: Json
        }[]
      }
      get_email_quota: {
        Args: {
          category: string
        }
        Returns: number
      }
      get_email_standardization_status: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["CompositeTypes"]["email_standardization_status"]
      }
      get_maintenance_history: {
        Args: {
          days?: number
        }
        Returns: {
          execution_time: string
          status: string
          duration_seconds: number
          details: Json
        }[]
      }
      get_member_email_status: {
        Args: {
          p_member_number: string
        }
        Returns: Json
      }
      get_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          name: string
          command: string
        }[]
      }
      get_system_metrics_history: {
        Args: Record<PropertyKey, never>
        Returns: {
          recorded_at: string
          metric_name: string
          metric_value: number
          category: string
        }[]
      }
      get_tables_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          columns: Json
          rls_enabled: boolean
        }[]
      }
      get_user_session_info: {
        Args: {
          user_id_param: string
        }
        Returns: {
          last_login: string
          is_active: boolean
        }[]
      }
      handle_email_standardization: {
        Args: {
          p_member_number: string
          p_attempt_legacy?: boolean
          p_check_whitelist?: boolean
        }
        Returns: Json
      }
      handle_email_sync: {
        Args: Record<PropertyKey, never>
        Returns: {
          status: string
          details: Json
        }[]
      }
      handle_email_sync_batched: {
        Args: {
          batch_size?: number
        }
        Returns: {
          status: string
          total_processed: number
          successful: number
          failed: number
          details: Json
        }[]
      }
      handle_failed_login: {
        Args: {
          member_number: string
        }
        Returns: Json
      }
      handle_password_reset:
        | {
            Args: {
              member_number: string
              new_password: string
              admin_user_id?: string
              ip_address?: string
              user_agent?: string
              client_info?: Json
            }
            Returns: Json
          }
        | {
            Args: {
              member_number: string
              new_password: string
              current_password?: string
              ip_address?: string
              user_agent?: string
              client_info?: Json
            }
            Returns: Json
          }
      handle_password_reset_request: {
        Args: {
          p_member_number: string
          p_email: string
          p_new_email?: string
        }
        Returns: Json
      }
      handle_password_reset_with_token: {
        Args: {
          token_value: string
          new_password: string
          ip_address?: string
          user_agent?: string
          client_info?: Json
        }
        Returns: Json
      }
      initiate_email_transition: {
        Args: {
          p_member_number: string
          p_new_email: string
        }
        Returns: Json
      }
      initiate_email_transition_with_reset: {
        Args: {
          p_member_number: string
          p_new_email?: string
        }
        Returns: Json
      }
      initiate_password_reset_flow: {
        Args: {
          p_member_number: string
          p_new_email?: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: Json
      }
      is_admin: {
        Args: {
          user_uid: string
        }
        Returns: boolean
      }
      is_payment_overdue: {
        Args: {
          due_date: string
        }
        Returns: boolean
      }
      is_system_in_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_temp_email: {
        Args: {
          email: string
        }
        Returns: boolean
      }
      is_valid_email: {
        Args: {
          email: string
        }
        Returns: boolean
      }
      is_valid_member_number: {
        Args: {
          member_num: string
        }
        Returns: boolean
      }
      log_login_attempt: {
        Args: {
          p_member_number: string
          p_attempted_email: string
          p_status: string
          p_error_details?: Json
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      maintain_collector_roles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      manual_cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      perform_automated_backup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      perform_system_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      perform_user_roles_sync: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_email_queue: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_payment_retention: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_user_role: {
        Args: {
          p_user_id: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      reset_failed_login: {
        Args: {
          member_number: string
        }
        Returns: undefined
      }
      reset_password_rate_limit: {
        Args: {
          p_member_number: string
          p_ip_address: string
        }
        Returns: undefined
      }
      reset_password_to_member_number: {
        Args: {
          p_user_id: string
          p_member_number: string
        }
        Returns: Json
      }
      reset_user_login_state: {
        Args: {
          p_member_number: string
        }
        Returns: Json
      }
      restore_from_backup: {
        Args: {
          backup_data: Json
        }
        Returns: string
      }
      rollback_email_migration: {
        Args: {
          p_member_number: string
        }
        Returns: Json
      }
      run_combined_system_checks: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          metric_name: string
          current_value: number
          threshold: number
          status: string
          check_details: Json
          test_category: string
        }[]
      }
      schedule_system_maintenance: {
        Args: {
          schedule?: string
        }
        Returns: undefined
      }
      standardize_auth_emails:
        | {
            Args: Record<PropertyKey, never>
            Returns: {
              member_number: string
              old_email: string
              new_email: string
              status: string
            }[]
          }
        | {
            Args: {
              p_member_number: string
            }
            Returns: Json
          }
      toggle_loops_integration: {
        Args: {
          p_is_active: boolean
        }
        Returns: Json
      }
      track_email_event: {
        Args: {
          p_email_log_id: string
          p_event_type: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      track_login_pattern: {
        Args: {
          p_user_id: string
          p_member_number: string
          p_success: boolean
          p_metadata?: Json
        }
        Returns: undefined
      }
      update_collector_profiles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_payment_analytics_summary: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      use_reset_token: {
        Args: {
          token_value: string
        }
        Returns: {
          member_number: string
          user_id: string
        }[]
      }
      validate_current_password: {
        Args: {
          p_member_number: string
          p_current_password: string
        }
        Returns: Json
      }
      validate_email_migration: {
        Args: {
          p_member_number: string
        }
        Returns: Json
      }
      validate_password_complexity: {
        Args: {
          password: string
        }
        Returns: Json
      }
      validate_reset_token: {
        Args: {
          p_reset_token: string
        }
        Returns: Json
      }
      validate_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          status: string
          details: Json
        }[]
      }
      verify_backup: {
        Args: {
          backup_id: string
        }
        Returns: Json
      }
      verify_email_and_get_reset_token: {
        Args: {
          p_verification_token: string
        }
        Returns: Json
      }
      verify_email_transition: {
        Args: {
          p_verification_token: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "collector" | "member"
      approval_status: "pending" | "approved" | "rejected"
      audit_operation:
        | "create"
        | "update"
        | "delete"
        | "INSERT"
        | "UPDATE"
        | "DELETE"
      auth_token_type: "magiclink" | "recovery" | "signup"
      backup_operation_type: "backup" | "restore"
      collector_role_status:
        | "started"
        | "processing"
        | "completed"
        | "failed"
        | "created"
      email_priority: "critical" | "high" | "normal" | "low" | "bulk"
      email_status: "pending" | "sent" | "delivered" | "failed" | "bounced"
      email_template_category: "payment" | "notification" | "system" | "custom"
      email_transition_type: "verification" | "reset" | "temp_to_personal"
      email_type:
        | "password_reset"
        | "welcome"
        | "verification"
        | "notification"
        | "system_announcement"
        | "payment_confirmation"
        | "payment_receipt"
      email_verification_status: "pending" | "verified" | "completed" | "failed"
      health_status: "healthy" | "warning" | "critical"
      monitoring_event_type:
        | "system_performance"
        | "api_latency"
        | "error_rate"
        | "user_activity"
        | "resource_usage"
      payment_method: "bank_transfer" | "cash"
      performance_metric:
        | "response_time"
        | "query_performance"
        | "connection_count"
        | "cache_hit_ratio"
      severity_level: "info" | "warning" | "error" | "critical"
      token_type: "password_reset" | "magic_link"
    }
    CompositeTypes: {
      email_standardization_status: {
        total_members: number | null
        standardized_count: number | null
        legacy_count: number | null
        personal_email_count: number | null
        failed_migrations_count: number | null
        last_migration_timestamp: string | null
        recent_failures: Json[] | null
      }
      reset_rate_limit_error: {
        message: string | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
