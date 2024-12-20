export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AdminNote {
  Row: {
    admin_id: string | null
    created_at: string
    id: string
    member_id: string | null
    note: string
    updated_at: string
  }
  Insert: {
    admin_id?: string | null
    created_at?: string
    id?: string
    member_id?: string | null
    note: string
    updated_at?: string
  }
  Update: {
    admin_id?: string | null
    created_at?: string
    id?: string
    member_id?: string | null
    note?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "admin_notes_admin_id_fkey"
      columns: ["admin_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "admin_notes_member_id_fkey"
      columns: ["member_id"]
      isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },
  ]
}

export interface Collector {
  Row: {
    active: boolean | null
    created_at: string
    email: string | null
    id: string
    name: string
    number: string
    phone: string | null
    prefix: string
    updated_at: string
  }
  Insert: {
    active?: boolean | null
    created_at?: string
    email?: string | null
    id?: string
    name: string
    number: string
    phone?: string | null
    prefix: string
    updated_at?: string
  }
  Update: {
    active?: boolean | null
    created_at?: string
    email?: string | null
    id?: string
    name?: string
    number?: string
    phone?: string | null
    prefix?: string
    updated_at?: string
  }
  Relationships: []
}

export interface FamilyMember {
  Row: {
    created_at: string
    date_of_birth: string | null
    gender: string | null
    id: string
    member_id: string | null
    name: string
    relationship: string
    updated_at: string
  }
  Insert: {
    created_at?: string
    date_of_birth?: string | null
    gender?: string | null
    id?: string
    member_id?: string | null
    name: string
    relationship: string
    updated_at?: string
  }
  Update: {
    created_at?: string
    date_of_birth?: string | null
    gender?: string | null
    id?: string
    member_id?: string | null
    name?: string
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

export interface Member {
  Row: {
    address: string | null
    collector: string | null
    collector_id: string | null
    cors_enabled: boolean | null
    created_at: string
    date_of_birth: string | null
    default_password_hash: string | null
    email: string | null
    email_verified: boolean | null
    first_time_login: boolean | null
    full_name: string
    gender: string | null
    id: string
    marital_status: string | null
    member_number: string
    membership_type: string | null
    password_changed: boolean | null
    phone: string | null
    postcode: string | null
    profile_completed: boolean | null
    profile_updated: boolean | null
    registration_completed: boolean | null
    status: string | null
    town: string | null
    updated_at: string
    verified: boolean | null
  }
  Insert: {
    address?: string | null
    collector?: string | null
    collector_id?: string | null
    cors_enabled?: boolean | null
    created_at?: string
    date_of_birth?: string | null
    default_password_hash?: string | null
    email?: string | null
    email_verified?: boolean | null
    first_time_login?: boolean | null
    full_name: string
    gender?: string | null
    id?: string
    marital_status?: string | null
    member_number: string
    membership_type?: string | null
    password_changed?: boolean | null
    phone?: string | null
    postcode?: string
    profile_completed?: boolean | null
    profile_updated?: boolean | null
    registration_completed?: boolean | null
    status?: string | null
    town?: string | null
    updated_at?: string
    verified?: boolean | null
  }
  Update: {
    address?: string | null
    collector?: string | null
    collector_id?: string | null
    cors_enabled?: boolean | null
    created_at?: string
    date_of_birth?: string | null
    default_password_hash?: string | null
    email?: string | null
    email_verified?: boolean | null
    first_time_login?: boolean | null
    full_name?: string
    gender?: string | null
    id?: string
    marital_status?: string | null
    member_number?: string
    membership_type?: string | null
    password_changed?: boolean | null
    phone?: string | null
    postcode?: string | null
    profile_completed?: boolean | null
    profile_updated?: boolean | null
    registration_completed?: boolean | null
    status?: string | null
    town?: string | null
    updated_at?: string
    verified?: boolean | null
  }
  Relationships: [
    {
      foreignKeyName: "members_collector_id_fkey"
      columns: ["collector_id"]
      isOneToOne: false
      referencedRelation: "collectors"
      referencedColumns: ["id"]
    },
  ]
}

export interface Payment {
  Row: {
    amount: number
    collector_id: string | null
    created_at: string
    id: string
    member_id: string | null
    notes: string | null
    payment_date: string
    payment_type: string
    status: string | null
    updated_at: string
  }
  Insert: {
    amount: number
    collector_id?: string | null
    created_at?: string
    id?: string
    member_id?: string | null
    notes?: string | null
    payment_date?: string
    payment_type: string
    status?: string | null
    updated_at?: string
  }
  Update: {
    amount?: number
    collector_id?: string | null
    created_at?: string
    id?: string
    member_id?: string | null
    notes?: string | null
    payment_date?: string
    payment_type?: string
    status?: string | null
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "payments_collector_id_fkey"
      columns: ["collector_id"]
      isOneToOne: false
      referencedRelation: "collectors"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "payments_member_id_fkey"
      columns: ["member_id"]
      isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },
  ]
}

export interface Profile {
  Row: {
    created_at: string
    email: string | null
    id: string
    role: Database["public"]["Enums"]["user_role"] | null
    updated_at: string
    user_id: string | null
  }
  Insert: {
    created_at?: string
    email?: string | null
    id?: string
    role?: Database["public"]["Enums"]["user_role"] | null
    updated_at?: string
    user_id?: string | null
  }
  Update: {
    created_at?: string
    email?: string | null
    id?: string
    role?: Database["public"]["Enums"]["user_role"] | null
    updated_at?: string
    user_id?: string | null
  }
  Relationships: []
}

export interface Registration {
  Row: {
    created_at: string
    id: string
    member_id: string | null
    status: string | null
    updated_at: string
  }
  Insert: {
    created_at?: string
    id?: string
    member_id?: string | null
    status?: string | null
    updated_at?: string
  }
  Update: {
    created_at?: string
    id?: string
    member_id?: string | null
    status?: string | null
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "registrations_member_id_fkey"
      columns: ["member_id"]
      isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },
  ]
}

export interface SupportTicket {
  Row: {
    created_at: string
    description: string
    id: string
    member_id: string | null
    priority: string | null
    status: string | null
    subject: string
    updated_at: string
  }
  Insert: {
    created_at?: string
    description: string
    id?: string
    member_id?: string | null
    priority?: string | null
    status?: string | null
    subject: string
    updated_at?: string
  }
  Update: {
    created_at?: string
    description?: string
    id?: string
    member_id?: string | null
    priority?: string | null
    status?: string | null
    subject?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "support_tickets_member_id_fkey"
      columns: ["member_id"]
      isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },
  ]
}

export interface TicketResponse {
  Row: {
    created_at: string
    id: string
    responder_id: string | null
    response: string
    ticket_id: string | null
    updated_at: string
  }
  Insert: {
    created_at?: string
    id?: string
    responder_id?: string | null
    response: string
    ticket_id?: string | null
    updated_at?: string
  }
  Update: {
    created_at?: string
    id?: string
    responder_id?: string | null
    response?: string
    ticket_id?: string | null
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "ticket_responses_responder_id_fkey"
      columns: ["responder_id"]
      isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "ticket_responses_ticket_id_fkey"
      columns: ["ticket_id"]
      isOneToOne: false
      referencedRelation: "support_tickets"
      referencedColumns: ["id"]
    },
  ]
}

export interface Functions {
  merge_duplicate_collectors: {
    Args: Record<PropertyKey, never>
    Returns: {
      merged_count: number
      details: string
    }[]
  }
  normalize_collector_name: {
    Args: {
      name: string
    }
    Returns: string
  }
  sync_collector_ids: {
    Args: Record<PropertyKey, never>
    Returns: undefined
  }
  create_profile: {
    Args: {
      p_id: string
      p_email: string
      p_user_id: string
    }
    Returns: void
  }
}
