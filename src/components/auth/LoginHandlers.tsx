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

    // Only create new account if first time login AND no auth user exists
    if (!member.auth_user_id) {
      console.log("No auth user found, creating account");
      
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
            email_verified: true,
            first_time_login: false
          })
          .eq('id', member.id)
          .single();

        if (updateError) {
          console.error('Error updating member:', updateError);
        }
      }
    }

    // If no auth_user_id exists, use member number as password
    // Otherwise use the provided password
    const loginPassword = !member.auth_user_id ? member.member_number.trim() : password;
    
    console.log("Attempting sign in with:", { 
      email, 
      isFirstTimeLogin: member.first_time_login,
      hasAuthUserId: !!member.auth_user_id,
      usingMemberNumberAsPassword: !member.auth_user_id
    });
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword
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
