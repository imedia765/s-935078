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
    
    // For first time login, always use member number as password
    if (!member.password_changed) {
      console.log("First time login detected, using member number as password");
      
      // Try to sign in with member number as password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: member.member_number.trim()
      });

      if (signInError) {
        console.log('Initial sign in failed:', signInError.message);
        
        // Prepare user metadata - ensure all fields are properly formatted
        const metadata = {
          member_id: member.id,
          member_number: member.member_number.trim(),
          full_name: member.full_name?.trim() || '',
          date_of_birth: member.date_of_birth || null,
          gender: member.gender?.toLowerCase() || null,
          marital_status: member.marital_status?.toLowerCase() || null,
          phone: member.phone?.trim() || null,
          address: member.address?.trim() || null,
          postcode: member.postcode?.trim() || null,
          town: member.town?.trim() || null
        };

        // Only attempt signup if user doesn't exist
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: member.member_number.trim(),
          options: {
            data: metadata
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          throw new Error(signUpError.message || "Failed to create account");
        }

        // If signup succeeded, try signing in again
        const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
          email,
          password: member.member_number.trim()
        });

        if (finalSignInError) {
          console.error('Final sign in error:', finalSignInError);
          throw new Error("Failed to sign in after account creation");
        }

        if (!finalSignInData.user?.id) {
          throw new Error("No user ID returned after sign in");
        }

        // Update member record to link it with auth user
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            auth_user_id: finalSignInData.user.id,
            email_verified: true,
            first_time_login: false
          })
          .eq('id', member.id)
          .single();

        if (updateError) {
          console.error('Error updating member:', updateError);
          throw new Error("Failed to link account");
        }

        navigate("/admin");
        return;
      }

      if (signInData?.user) {
        // Update first time login flag
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

        navigate("/admin");
        return;
      }
    } else {
      // Regular login with provided password
      console.log('Attempting regular login with provided password');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: password.trim()
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw new Error("Invalid member ID or password");
      }

      if (signInData?.user) {
        navigate("/admin");
        return;
      }
    }

    throw new Error("Login failed");
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}