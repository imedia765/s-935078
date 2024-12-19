import { supabase } from "@/integrations/supabase/client";

export const handleFirstTimeAuth = async (memberId: string, password: string) => {
  const cleanMemberId = memberId.toUpperCase().trim();
  console.log("Handling first time auth for member:", cleanMemberId);

  try {
    // First, get the member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('email, first_time_login')
      .eq('member_number', cleanMemberId)
      .maybeSingle();

    if (memberError) {
      console.error("Member lookup error:", memberError);
      throw new Error("Error looking up member details");
    }

    if (!member) {
      console.error("No member found with ID:", cleanMemberId);
      throw new Error("Invalid Member ID. Please check your credentials and try again.");
    }

    if (!member.first_time_login) {
      console.error("Member has already completed first-time login:", cleanMemberId);
      throw new Error("This member has already logged in. Please use the regular login page.");
    }

    // Use existing email or generate temporary one
    const tempEmail = member.email || `${cleanMemberId.toLowerCase()}@temporary.pwaburton.org`;
    console.log("Using email for auth:", tempEmail);

    // Try to sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: cleanMemberId, // For first time login, password is the member ID
    });

    if (signInError) {
      console.log("Sign in failed, attempting signup. Error:", signInError);
      
      // If sign in fails, try to sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email: tempEmail,
        password: cleanMemberId,
        options: {
          data: {
            member_number: cleanMemberId
          }
        }
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }

      // After successful signup, try signing in again
      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: cleanMemberId
      });

      if (finalSignInError) {
        console.error("Final sign in error:", finalSignInError);
        throw finalSignInError;
      }
    }

    // Update member record
    const { error: updateError } = await supabase
      .from('members')
      .update({
        email: tempEmail,
        first_time_login: false
      })
      .eq('member_number', cleanMemberId);

    if (updateError) {
      console.error("Error updating member record:", updateError);
      throw updateError;
    }

    console.log("First time auth successful for member:", cleanMemberId);
    return { success: true };
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};