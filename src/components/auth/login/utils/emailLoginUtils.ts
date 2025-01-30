import { supabase } from "@/integrations/supabase/client";

export const attemptEmailLogin = async (email: string, password: string) => {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: password.trim(),
  });

  if (signInError) throw signInError;
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