export interface MemberWithRelations {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_number: string;
  failed_login_attempts: number | null;
  user_roles: Array<{ role: string }>;
  member_notes: Array<{ note_text: string; note_type: string }>;
  payment_requests: Array<{ status: string | null; amount: number; payment_type: string }>;
  status: string;
  date_of_birth: string | null;
  address: string | null;
  membership_type: string | null;
  payment_date: string | null;
  family_members: Array<{ full_name: string; relationship: string; date_of_birth: string | null }>;
}