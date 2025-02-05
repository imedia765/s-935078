
import { UserRole } from "@/types/auth";

export type AppRole = UserRole;
export type FixType = UserRole | 'remove_role';

export interface User {
  id: string;
  email?: string;
  member_number?: string;
  full_name?: string;
  user_roles?: { role: AppRole }[];
}

export interface ValidationDetails {
  auth_user_id?: string;
  user_id?: string;
  status?: string;
  verified?: boolean;
  full_name?: string;
  member_number?: string;
  current_roles?: AppRole[];
  member_status?: string;
  email?: string;
}

export interface FixOption {
  label: string;
  value: FixType;
  description: string;
  icon?: React.ReactNode;
  action?: () => Promise<void>;
}
