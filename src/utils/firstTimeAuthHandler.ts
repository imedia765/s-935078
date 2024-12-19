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
    await delay(1000); // Wait for signout to complete

    // Try to sign in first
    console.log("Attempting sign in with temporary email");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: cleanMemberId
    });

    if (!signInError) {
      console.log("Sign in successful");
      await updateMemberStatus(cleanMemberId);
      return { success: true };
    }

    console.log("Sign in failed, attempting signup");
    await delay(1000); // Wait before signup attempt

    // Implement retry logic for signup
    const maxRetries = 5;
    const baseDelay = 2000; // 2 seconds base delay

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Signup attempt ${attempt + 1}/${maxRetries}`);

        const { error: signUpError } = await supabase.auth.signUp({
          email: tempEmail,
          password: cleanMemberId,
          options: {
            data: {
              member_number: cleanMemberId
            }
          }
        });

        if (!signUpError) {
          console.log("Signup successful, waiting for processing");
          await delay(3000); // Wait for signup processing

          console.log("Confirming email via Edge Function");
          const { error: confirmError } = await supabase.functions.invoke('confirm-user-email', {
            body: { email: tempEmail }
          });

          if (confirmError) {
            console.error("Error confirming email:", confirmError);
            throw confirmError;
          }

          console.log("Email confirmed, attempting final sign in");
          await delay(2000); // Wait before final sign in

          const { error: finalSignInError } = await supabase.auth.signInWithPassword({
            email: tempEmail,
            password: cleanMemberId
          });

          if (!finalSignInError) {
            console.log("Authentication process completed successfully");
            await updateMemberStatus(cleanMemberId);
            return { success: true };
          }

          throw finalSignInError;
        }

        // Handle rate limit
        if (signUpError.status === 429) {
          const jitter = Math.random() * 1000; // Random delay between 0-1s
          const retryDelay = (baseDelay * Math.pow(2, attempt)) + jitter;
          console.log(`Rate limit hit, waiting ${Math.round(retryDelay)}ms before retry`);
          await delay(retryDelay);
          continue;
        }

        throw signUpError;
      } catch (error: any) {
        console.error(`Attempt ${attempt + 1} failed:`, error);

        if (error?.status === 429 && attempt < maxRetries - 1) {
          const jitter = Math.random() * 1000;
          const retryDelay = (baseDelay * Math.pow(2, attempt)) + jitter;
          console.log(`Rate limit hit, waiting ${Math.round(retryDelay)}ms before retry`);
          await delay(retryDelay);
          continue;
        }

        if (attempt === maxRetries - 1) {
          console.error("Max retries reached");
          throw new Error("Failed to authenticate after multiple attempts. Please try again later.");
        }
      }
    }

    throw new Error("Authentication failed after all retries");
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