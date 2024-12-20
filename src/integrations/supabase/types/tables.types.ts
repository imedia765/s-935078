import type { Database } from './database';

export interface Tables {
  admin_notes: AdminNotes;
  codebase_backups: CodebaseBackups;
  collectors: Collectors;
  database_logs: DatabaseLogs;
  error_logs: ErrorLogs;
  family_members: FamilyMembers;
  members: Members;
  payments: Payments;
  profiles: Profiles;
  registrations: Registrations;
  support_tickets: SupportTickets;
  ticket_responses: TicketResponses;
}

export interface AdminNotes {
  Row: {
    id: string;
    member_id: string | null;
    admin_id: string | null;
    note: string;
    created_at: string;
    updated_at: string;
  }
  Insert: {
    id?: string;
    member_id?: string | null;
    admin_id?: string | null;
    note: string;
    created_at?: string;
    updated_at?: string;
  }
  Update: {
    id?: string;
    member_id?: string | null;
    admin_id?: string | null;
    note?: string;
    created_at?: string;
    updated_at?: string;
  }
}

export interface CodebaseBackups {
  Row: {
    created_at: string;
    created_by: string | null;
    download_count: number | null;
    filename: string;
    id: string;
    size: number | null;
  }
  Insert: {
    created_at?: string;
    created_by?: string | null;
    download_count?: number | null;
    filename: string;
    id?: string;
    size?: number | null;
  }
  Update: {
    created_at?: string;
    created_by?: string | null;
    download_count?: number | null;
    filename?: string;
    id?: string;
    size?: number | null;
  }
}

export interface Collectors {
  Row: {
    active: boolean | null;
    created_at: string;
    email: string | null;
    id: string;
    name: string;
    number: string;
    phone: string | null;
    prefix: string;
    updated_at: string;
  }
  Insert: {
    active?: boolean | null;
    created_at?: string;
    email?: string | null;
    id?: string;
    name: string;
    number: string;
    phone?: string | null;
    prefix: string;
    updated_at?: string;
  }
  Update: {
    active?: boolean | null;
    created_at?: string;
    email?: string | null;
    id?: string;
    name?: string;
    number?: string;
    phone?: string | null;
    prefix?: string;
    updated_at?: string;
  }
}

export interface DatabaseLogs {
  Row: {
    action: string;
    created_at: string;
    details: string | null;
    id: string;
    performed_by: string | null;
  }
  Insert: {
    action: string;
    created_at?: string;
    details?: string | null;
    id?: string;
    performed_by?: string | null;
  }
  Update: {
    action?: string;
    created_at?: string;
    details?: string | null;
    id?: string;
    performed_by?: string | null;
  }
}

export interface ErrorLogs {
  Row: {
    context: Json | null;
    created_at: string;
    error_message: string;
    id: string;
    stack_trace: string | null;
    user_id: string | null;
  }
  Insert: {
    context?: Json | null;
    created_at: string;
    error_message: string;
    id?: string;
    stack_trace?: string | null;
    user_id?: string | null;
  }
  Update: {
    context?: Json | null;
    created_at?: string;
    error_message?: string;
    id?: string;
    stack_trace?: string | null;
    user_id?: string | null;
  }
}

export interface FamilyMembers {
  Row: {
    created_at: string;
    date_of_birth: string | null;
    gender: string | null;
    id: string;
    member_id: string | null;
    name: string;
    relationship: string;
    updated_at: string;
  }
  Insert: {
    created_at?: string;
    date_of_birth?: string | null;
    gender?: string | null;
    id?: string;
    member_id?: string | null;
    name: string;
    relationship: string;
    updated_at?: string;
  }
  Update: {
    created_at?: string;
    date_of_birth?: string | null;
    gender?: string | null;
    id?: string;
    member_id?: string | null;
    name?: string;
    relationship?: string;
    updated_at?: string;
  }
}

export interface Members {
  Row: {
    address: string | null;
    collector: string | null;
    collector_id: string | null;
    cors_enabled: boolean | null;
    created_at: string;
    date_of_birth: string | null;
    default_password_hash: string | null;
    email: string | null;
    email_verified: boolean | null;
    first_time_login: boolean | null;
    full_name: string;
    gender: string | null;
    id: string;
    marital_status: string | null;
    member_number: string;
    membership_type: string | null;
    password_changed: boolean | null;
    phone: string | null;
    postcode: string | null;
    profile_completed: boolean | null;
    profile_updated: boolean | null;
    registration_completed: boolean | null;
    status: string | null;
    town: string | null;
    updated_at: string;
    verified: boolean | null;
  }
  Insert: {
    address?: string | null;
    collector?: string | null;
    collector_id?: string | null;
    cors_enabled?: boolean | null;
    created_at?: string;
    date_of_birth?: string | null;
    default_password_hash?: string | null;
    email?: string | null;
    email_verified?: boolean | null;
    first_time_login?: boolean | null;
    full_name: string;
    gender?: string | null;
    id?: string;
    marital_status?: string | null;
    member_number: string;
    membership_type?: string | null;
    password_changed?: boolean | null;
    phone?: string | null;
    postcode?: string;
    profile_completed?: boolean | null;
    profile_updated?: boolean | null;
    registration_completed?: boolean | null;
    status?: string | null;
    town?: string | null;
    updated_at?: string;
    verified?: boolean | null;
  }
  Update: {
    address?: string | null;
    collector?: string | null;
    collector_id?: string | null;
    cors_enabled?: boolean | null;
    created_at?: string;
    date_of_birth?: string | null;
    default_password_hash?: string | null;
    email?: string | null;
    email_verified?: boolean | null;
    first_time_login?: boolean | null;
    full_name?: string;
    gender?: string | null;
    id?: string;
    marital_status?: string | null;
    member_number?: string;
    membership_type?: string | null;
    password_changed?: boolean | null;
    phone?: string | null;
    postcode?: string | null;
    profile_completed?: boolean | null;
    profile_updated?: boolean | null;
    registration_completed?: boolean | null;
    status?: string | null;
    town?: string | null;
    updated_at?: string;
    verified?: boolean | null;
  }
}

export interface Payments {
  Row: {
    amount: number;
    collector_id: string | null;
    created_at: string;
    id: string;
    member_id: string | null;
    notes: string | null;
    payment_date: string;
    payment_type: string;
    status: string | null;
    updated_at: string;
  }
  Insert: {
    amount: number;
    collector_id?: string | null;
    created_at?: string;
    id?: string;
    member_id?: string | null;
    notes?: string | null;
    payment_date?: string;
    payment_type: string;
    status?: string | null;
    updated_at?: string;
  }
  Update: {
    amount?: number;
    collector_id?: string | null;
    created_at?: string;
    id?: string;
    member_id?: string | null;
    notes?: string | null;
    payment_date?: string;
    payment_type?: string;
    status?: string | null;
    updated_at?: string;
  }
}

export interface Profiles {
  Row: {
    id: string;
    user_id: string | null;
    email: string | null;
    created_at: string;
    updated_at: string;
    role: Database['public']['Enums']['user_role'] | null;
  }
  Insert: {
    id?: string;
    user_id?: string | null;
    email?: string | null;
    created_at?: string;
    updated_at?: string;
    role?: Database['public']['Enums']['user_role'] | null;
  }
  Update: {
    id?: string;
    user_id?: string | null;
    email?: string | null;
    created_at?: string;
    updated_at?: string;
    role?: Database['public']['Enums']['user_role'] | null;
  }
}

export interface Registrations {
  Row: {
    created_at: string;
    id: string;
    member_id: string | null;
    status: string | null;
    updated_at: string;
  }
  Insert: {
    created_at?: string;
    id?: string;
    member_id?: string | null;
    status?: string | null;
    updated_at?: string;
  }
  Update: {
    created_at?: string;
    id?: string;
    member_id?: string | null;
    status?: string | null;
    updated_at?: string;
  }
}

export interface SupportTickets {
  Row: {
    created_at: string;
    description: string;
    id: string;
    member_id: string | null;
    priority: string | null;
    status: string | null;
    subject: string;
    updated_at: string;
  }
  Insert: {
    created_at?: string;
    description: string;
    id?: string;
    member_id?: string | null;
    priority?: string | null;
    status?: string | null;
    subject: string;
    updated_at?: string;
  }
  Update: {
    created_at?: string;
    description?: string;
    id?: string;
    member_id?: string | null;
    priority?: string | null;
    status?: string | null;
    subject?: string;
    updated_at?: string;
  }
}

export interface TicketResponses {
  Row: {
    created_at: string;
    id: string;
    responder_id: string | null;
    response: string;
    ticket_id: string | null;
    updated_at: string;
  }
  Insert: {
    created_at?: string;
    id?: string;
    responder_id?: string | null;
    response: string;
    ticket_id?: string | null;
    updated_at?: string;
  }
  Update: {
    created_at?: string;
    id?: string;
    responder_id?: string | null;
    response?: string;
    ticket_id?: string | null;
    updated_at?: string;
  }
}
