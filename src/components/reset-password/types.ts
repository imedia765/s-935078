
import { Json } from "@/integrations/supabase/types";

export interface RPCResponse {
  success: boolean;
  error?: string;
  user_id?: string;
  member_number?: string;
}

export interface ValidateTokenParams {
  p_reset_token: string;
}

export interface EmailTransitionResponse extends RPCResponse {
  email?: string;
  requires_verification?: boolean;
  verification_token?: string;
  reset_token?: string;
  code?: string;
  remaining_time?: string;
}

export interface EmailVerificationResponse extends RPCResponse {
  reset_token?: string;
}

export interface EmailStatus {
  success: boolean;
  member_number?: string;
  email?: string;
  is_temp_email?: boolean;
  has_auth_id?: boolean;
  error?: string;
}
