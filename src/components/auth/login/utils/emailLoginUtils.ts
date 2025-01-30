import { supabase } from "@/integrations/supabase/client";

export const attemptEmailLogin = async (email: string, password: string) => {
  // If input looks like a member number (2 letters followed by 5 digits)
  const isMemberNumber = /^[A-Z]{2}\d{5}$/.test(email);
  const loginEmail = isMemberNumber ? `${email.toLowerCase()}@temp.com` : email;

  console.log('[Login] Attempting login with:', { 
    originalInput: email,
    isMemberNumber,
    loginEmail,
    timestamp: new Date().toISOString()
  });

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password: password.trim(),
  });

  if (signInError) {
    console.error('[Login] Sign in error:', {
      error: signInError,
      email: loginEmail,
      timestamp: new Date().toISOString()
    });
    throw signInError;
  }

  return signInData;
};

export const getMemberEmail = async (memberNumber: string) => {
  const { data: memberData } = await supabase
    .from('members')
    .select('email')
    .eq('member_number', memberNumber)
    .maybeSingle();

  if (!memberData?.email) {
    throw new Error('Email not set for this member. Please contact support.');
  }

  return memberData.email;
};