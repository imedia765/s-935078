import { supabase } from "@/integrations/supabase/client";

export const handleFirstTimeAuth = async (memberId: string, password: string) => {
  const cleanMemberId = memberId.toUpperCase().trim();
  console.log("Handling first time auth for member:", cleanMemberId);

  // First, get the member details
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('email, first_time_login, password_changed')
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
    console.log("Member has already completed first-time login");
    throw new Error("This member has already logged in. Please use the regular login page.");
  }

  // Use existing email or generate temporary one
  const tempEmail = member.email || `${cleanMemberId.toLowerCase()}@temporary.pwaburton.org`;
  console.log("Using email for auth:", tempEmail);

  try {
    // First try to sign in
    console.log("Attempting sign in with:", { email: tempEmail });
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password
    });

    if (signInError) {
      console.log("Sign in failed, attempting signup. Error:", signInError);
      
      // If sign in fails, try to sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email: tempEmail,
        password,
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

      console.log("Signup successful, attempting final sign in");

      // After successful signup, try signing in again
      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password
      });

      if (finalSignInError) {
        console.error("Final sign in error:", finalSignInError);
        throw finalSignInError;
      }

      console.log("Final sign in successful");
    } else {
      console.log("Initial sign in successful");
    }

    // Update member record
    const { error: updateError } = await supabase
      .from('members')
      .update({
        first_time_login: false,
        email: tempEmail
      })
      .eq('member_number', cleanMemberId);

    if (updateError) {
      console.error("Error updating member record:", updateError);
      throw updateError;
    }

    return { success: true };
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};