import { supabase } from "@/integrations/supabase/client";
import { FailedLoginResponse } from "../types/loginTypes";

export const validateMemberNumberFormat = (memberNumber: string) => {
  if (!memberNumber.includes('@') && !/^[A-Z]{2}\d{5}$/.test(memberNumber)) {
    throw new Error('Invalid member number format. Please use the format XX00000');
  }
};

export const handleFailedLogin = async (memberNumber: string) => {
  const { data: failedLoginData, error: failedLoginError } = await supabase
    .rpc('handle_failed_login', { member_number: memberNumber });

  if (failedLoginError) throw failedLoginError;

  const typedFailedLoginData = failedLoginData as unknown as FailedLoginResponse;
  
  if (!typedFailedLoginData || 
      typeof typedFailedLoginData.locked !== 'boolean' ||
      typeof typedFailedLoginData.attempts !== 'number' ||
      typeof typedFailedLoginData.max_attempts !== 'number' ||
      typeof typedFailedLoginData.lockout_duration !== 'string') {
    throw new Error('Invalid response from failed login handler');
  }

  return typedFailedLoginData;
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