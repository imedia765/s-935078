import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMemberByMemberId } from "@/utils/memberAuth";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    // First, look up the member
    const member = await getMemberByMemberId(memberId);
    
    if (!member) {
      console.error("Member lookup failed:", { memberId });
      throw new Error("Member ID not found");
    }
    
    // Use the email stored in the database
    const email = member.email;
    
    if (!email) {
      throw new Error("No email associated with this member ID");
    }
    
    console.log("Attempting member ID login with:", { memberId, email });

    // For first time login, we need to create the auth user first
    if (member.first_time_login && !member.auth_user_id) {
      console.log("First time login, creating auth user");
      
      // First try to sign in, in case the user already exists
      const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: member.member_number.trim()
      });

      if (signInError) {
        console.log("No existing user found, creating new one");
        // Create auth user with member number as password
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: member.member_number.trim(),
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              member_id: member.id,
              full_name: member.full_name
            }
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          throw new Error("Failed to create account");
        }

        if (signUpData?.user) {
          // Update member record with auth user id
          const { error: updateError } = await supabase
            .from('members')
            .update({ 
              auth_user_id: signUpData.user.id,
              email_verified: true // Since we're managing verification ourselves
            })
            .eq('id', member.id)
            .single();

          if (updateError) {
            console.error('Error updating member:', updateError);
          }
        }
      } else if (existingUser?.user) {
        // User exists but wasn't linked, update the member record
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            auth_user_id: existingUser.user.id,
            email_verified: true
          })
          .eq('id', member.id)
          .single();

        if (updateError) {
          console.error('Error updating member:', updateError);
        }
      }
    }

    // Now attempt to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: member.first_time_login ? member.member_number.trim() : password
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      throw new Error("Invalid member ID or password");
    }

    if (signInData?.user) {
      // If this was first time login, update the flags
      if (member.first_time_login) {
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            first_time_login: false,
            email_verified: true
          })
          .eq('id', member.id)
          .single();

        if (updateError) {
          console.error('Error updating member:', updateError);
        }
      }

      navigate("/admin");
      return;
    }

    throw new Error("Login failed");
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}