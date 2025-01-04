import { supabase } from "@/integrations/supabase/client";

export interface MemberAuthData {
  id: string;
  member_number: string;
  auth_user_id: string | null;
  email: string | null;
}

export async function verifyMember(memberNumber: string): Promise<MemberAuthData> {
  const { data: member, error } = await supabase
    .from('members')
    .select('id, member_number, auth_user_id, email')
    .ilike('member_number', memberNumber)
    .single();

  if (error) {
    console.error('Member verification error:', error);
    throw new Error('Error verifying member');
  }

  if (!member) {
    throw new Error('Member not found. Please check your member number.');
  }

  return member;
}

export async function createAuthAccount(memberNumber: string) {
  const formattedMemberNumber = memberNumber.toLowerCase();
  const email = `${formattedMemberNumber}@temp.pwaburton.org`;
  const password = formattedMemberNumber;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        member_number: memberNumber.toUpperCase(),
      }
    }
  });

  if (error && !error.message.includes('already registered')) {
    console.error('Auth account creation error:', error);
    throw error;
  }

  return data.user;
}

export async function signInMember(memberNumber: string) {
  const formattedMemberNumber = memberNumber.toLowerCase();
  const email = `${formattedMemberNumber}@temp.pwaburton.org`;
  const password = formattedMemberNumber;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }

  return data.user;
}

export async function linkMemberToAuth(memberId: string, authUserId: string) {
  const { error } = await supabase
    .from('members')
    .update({ auth_user_id: authUserId })
    .eq('id', memberId);

  if (error) {
    console.error('Error linking member to auth:', error);
    // Don't throw here as login was still successful
  }
}