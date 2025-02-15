
export interface EmailTransitionResponse {
  success: boolean;
  error?: string;
  email?: string;
  requires_verification?: boolean;
  verification_token?: string;
  reset_token?: string;
  code?: string;
  remaining_time?: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  error?: string;
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

