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

    // Generate temporary email with correct domain
    const tempEmail = `${cleanMemberId.toLowerCase()}@temporary.pwaburton.org`;
    console.log("Using email for auth:", tempEmail);

    // Update member record with temporary email first
    const { error: updateEmailError } = await supabase
      .from('members')
      .update({ email: tempEmail })
      .eq('member_number', cleanMemberId);

    if (updateEmailError) {
      console.error("Error updating member email:", updateEmailError);
      throw new Error("Failed to update member email");
    }

    // Try to sign up first since it's a first-time login
    console.log("Attempting signup for:", tempEmail);
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
      
      // If user already exists, try signing in
      if (signUpError.message.includes("User already registered")) {
        console.log("User exists, attempting sign in");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: cleanMemberId
        });

        if (signInError) {
          console.error("Sign in error:", signInError);
          throw signInError;
        }
      } else {
        throw signUpError;
      }
    }

    // Update member record to complete first-time login
    const { error: updateLoginError } = await supabase
      .from('members')
      .update({ first_time_login: false })
      .eq('member_number', cleanMemberId);

    if (updateLoginError) {
      console.error("Error updating first time login status:", updateLoginError);
      throw updateLoginError;
    }

    console.log("First time auth successful for member:", cleanMemberId);
    return { success: true };
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};