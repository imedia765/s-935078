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

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: memberId
    });

    if (!signInError && signInData?.user) {
      console.log("Sign in successful");
      navigate("/admin");
      return;
    }

    // If sign in fails, try to sign up
    console.log("Sign in failed, attempting signup");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: memberId,
      options: {
        data: {
          member_id: member.id,
          full_name: member.full_name
        }
      }
    });

    if (signUpError) {
      // If user already exists but sign in failed, they likely need to reset their password
      if (signUpError.message.includes("already registered")) {
        console.log("User exists but couldn't sign in, initiating password reset");
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`
        });
        
        if (resetError) {
          console.error('Password reset error:', resetError);
          throw new Error("Unable to reset password. Please contact support.");
        }
        
        throw new Error("A password reset link has been sent to your email.");
      }
      
      console.error('Sign up error:', signUpError);
      throw signUpError;
    }

    if (signUpData?.user) {
      // Update member record with auth user id
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          auth_user_id: signUpData.user.id,
          email_verified: true
        })
        .eq('id', member.id)
        .single();

      if (updateError) {
        console.error('Error updating member:', updateError);
        throw updateError;
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