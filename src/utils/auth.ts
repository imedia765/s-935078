import { supabase } from "@/integrations/supabase/client";

export interface MemberAuthData {
  id: string;
  member_number: string;
  auth_user_id: string | null;
  email: string | null;
}

export async function verifyMember(memberNumber: string): Promise<MemberAuthData> {
  console.log('Verifying member:', memberNumber);
  
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

  console.log('Member found:', member);
  return member;
}

export async function createAuthAccount(memberNumber: string) {
  // Try both uppercase and lowercase variations
  const upperMemberNumber = memberNumber.toUpperCase();
  const lowerMemberNumber = memberNumber.toLowerCase();
  
  console.log('Attempting to create auth account for member:', memberNumber);

  // First check if an account exists with either format
  const { data: existingUser } = await supabase.auth.signInWithPassword({
    email: `${lowerMemberNumber}@temp.pwaburton.org`,
    password: lowerMemberNumber,
  });

  if (existingUser?.user) {
    console.log('User exists with lowercase credentials');
    return existingUser.user;
  }

  const { data: existingUpperUser } = await supabase.auth.signInWithPassword({
    email: `${upperMemberNumber}@temp.pwaburton.org`,
    password: upperMemberNumber,
  });

  if (existingUpperUser?.user) {
    console.log('User exists with uppercase credentials');
    return existingUpperUser.user;
  }

  // If no existing user, create new account with lowercase format
  const { data, error } = await supabase.auth.signUp({
    email: `${lowerMemberNumber}@temp.pwaburton.org`,
    password: lowerMemberNumber,
    options: {
      data: {
        member_number: upperMemberNumber, // Store original format in metadata
      }
    }
  });

  if (error && !error.message.includes('already registered')) {
    console.error('Auth account creation error:', error);
    throw error;
  }

  console.log('Auth account created:', data.user?.id);
  return data.user;
}

export async function signInMember(memberNumber: string) {
  // Try both uppercase and lowercase variations
  const upperMemberNumber = memberNumber.toUpperCase();
  const lowerMemberNumber = memberNumber.toLowerCase();
  
  console.log('Attempting to sign in member:', memberNumber);

  // Try lowercase first
  try {
    const { data: lowerCaseSignIn, error: lowerCaseError } = await supabase.auth.signInWithPassword({
      email: `${lowerMemberNumber}@temp.pwaburton.org`,
      password: lowerMemberNumber,
    });

    if (lowerCaseSignIn?.user) {
      console.log('Signed in with lowercase credentials');
      return lowerCaseSignIn.user;
    }

    if (lowerCaseError && !lowerCaseError.message.includes('Invalid login credentials')) {
      throw lowerCaseError;
    }
  } catch (error) {
    console.log('Lowercase signin attempt failed, trying uppercase');
  }

  // Try uppercase if lowercase failed
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${upperMemberNumber}@temp.pwaburton.org`,
    password: upperMemberNumber,
  });

  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }

  console.log('Signed in successfully:', data.user.id);
  return data.user;
}

export async function linkMemberToAuth(memberId: string, authUserId: string) {
  console.log('Linking member to auth:', memberId, authUserId);
  
  const { error } = await supabase
    .from('members')
    .update({ auth_user_id: authUserId })
    .eq('id', memberId);

  if (error) {
    console.error('Error linking member to auth:', error);
    // Don't throw here as login was still successful
  } else {
    console.log('Successfully linked member to auth');
  }
}