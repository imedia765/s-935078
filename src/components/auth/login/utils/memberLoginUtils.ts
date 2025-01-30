import { supabase } from "@/integrations/supabase/client";
import { FailedLoginResponse } from "../types/loginTypes";

export const validateMemberNumberFormat = (memberNumber: string) => {
  // Skip validation if it's an email
  if (memberNumber.includes('@')) return;
  
  const memberNumberRegex = /^[A-Z]{2}\d{5}$/;
  if (!memberNumberRegex.test(memberNumber)) {
    throw new Error('Invalid member number format. Please use the format XX00000 (e.g., TM10003)');
  }
};

export const handleFailedLogin = async (memberNumber: string): Promise<FailedLoginResponse> => {
  console.log('[Login] Handling failed login for:', {
    memberNumber,
    timestamp: new Date().toISOString()
  });

  const { data: failedLoginData, error: failedLoginError } = await supabase
    .rpc('handle_failed_login', { member_number: memberNumber });

  if (failedLoginError) {
    console.error('[Login] Failed login handling error:', {
      error: failedLoginError,
      memberNumber,
      timestamp: new Date().toISOString()
    });
    throw failedLoginError;
  }

  // Validate response structure
  const response = failedLoginData as unknown as FailedLoginResponse;
  if (!response || 
      typeof response.locked !== 'boolean' ||
      typeof response.attempts !== 'number' ||
      typeof response.max_attempts !== 'number' ||
      typeof response.lockout_duration !== 'string') {
    throw new Error('Invalid response from failed login handler');
  }

  return response;
};

export const resetFailedAttempts = async (memberNumber: string) => {
  await supabase.rpc('reset_failed_login', { member_number: memberNumber });
};

export const checkPasswordResetRequired = async (memberNumber: string) => {
  const { data: memberData } = await supabase
    .from('members')
    .select('password_reset_required')
    .eq('member_number', memberNumber)
    .maybeSingle();

  return memberData?.password_reset_required;
};