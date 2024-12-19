import { supabase } from "@/integrations/supabase/client";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Generate temporary email
    const tempEmail = `${cleanMemberId.toLowerCase()}@temp.pwaburton.org`;
    console.log("Using temporary email for auth:", tempEmail);

    // Sign out any existing session first
    await supabase.auth.signOut();
    await delay(1000); // Short delay after signout

    // Try to sign in first
    console.log("Attempting initial sign in");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: cleanMemberId
    });

    if (!signInError) {
      console.log("Sign in successful");
      await updateMemberStatus(cleanMemberId);
      return { success: true };
    }

    // If sign in failed, we need to create the account
    console.log("Sign in failed, attempting signup");
    await delay(2000); // Delay before signup attempt

    try {
      // Clear any existing sessions before new attempt
      await supabase.auth.signOut();
      await delay(1000);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: tempEmail,
        password: cleanMemberId,
        options: {
          emailRedirectTo: undefined, // Disable email redirect
          data: {
            member_number: cleanMemberId
          }
        }
      });

      if (signUpError) {
        if (signUpError.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a few minutes and try again.");
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("No user data returned from signup");
      }

      console.log("Signup successful, waiting for processing");
      await delay(2000);

      // Final sign in attempt
      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: cleanMemberId
      });

      if (finalSignInError) {
        console.error("Final sign in error:", finalSignInError);
        throw finalSignInError;
      }

      console.log("Authentication process completed successfully");
      await updateMemberStatus(cleanMemberId);
      return { success: true };

    } catch (error: any) {
      console.error("Authentication error:", error);
      
      if (error.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a few minutes before trying again.");
      }
      
      throw error;
    }
  } catch (error) {
    console.error("First time login error:", error);
    throw error;
  }
};

const updateMemberStatus = async (memberId: string) => {
  const { error: updateError } = await supabase
    .from('members')
    .update({ 
      first_time_login: false,
      email_verified: true,
      password_changed: false
    })
    .eq('member_number', memberId);

  if (updateError) {
    console.error("Error updating member status:", updateError);
    throw updateError;
  }
};