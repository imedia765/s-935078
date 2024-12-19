import { supabase } from "@/integrations/supabase/client";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const BASE_DELAY = 2000; // 2 seconds base delay

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
    await delay(2000); // Increased delay after signout

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

    console.log("Sign in failed, attempting signup with increased delays");
    await delay(3000); // Increased delay before signup attempts

    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`Signup attempt ${attempt + 1}/${MAX_RETRIES}`);

        // Calculate exponential backoff with jitter
        const jitter = Math.random() * 2000; // Increased jitter range
        const retryDelay = (BASE_DELAY * Math.pow(2, attempt)) + jitter;

        if (attempt > 0) {
          console.log(`Waiting ${Math.round(retryDelay)}ms before retry...`);
          await delay(retryDelay);
        }

        // Clear any existing sessions before new attempt
        await supabase.auth.signOut();
        await delay(2000);

        // Create new auth session with minimal options
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: tempEmail,
          password: cleanMemberId,
          options: {
            data: {
              member_number: cleanMemberId
            }
          }
        });

        if (signUpError) {
          console.error(`Signup error on attempt ${attempt + 1}:`, signUpError);
          
          if (signUpError.status === 429) {
            lastError = signUpError;
            // For rate limits, use maximum delay
            await delay(BASE_DELAY * Math.pow(2, MAX_RETRIES) + 5000);
            continue;
          }
          
          throw signUpError;
        }

        if (!signUpData.user) {
          throw new Error("No user data returned from signup");
        }

        console.log("Signup successful, waiting for processing");
        await delay(5000); // Increased delay after signup

        console.log("Confirming email via Edge Function");
        const { error: confirmError } = await supabase.functions.invoke('confirm-user-email', {
          body: { email: tempEmail }
        });

        if (confirmError) {
          console.error("Error confirming email:", confirmError);
          throw confirmError;
        }

        console.log("Email confirmed, attempting final sign in");
        await delay(3000); // Increased delay before final signin

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
        lastError = error;
        console.error(`Error on attempt ${attempt + 1}:`, error);

        if (error?.status === 429 && attempt < MAX_RETRIES - 1) {
          // For rate limits, use maximum delay plus extra buffer
          await delay(BASE_DELAY * Math.pow(2, MAX_RETRIES) + 5000);
          continue;
        }

        if (attempt === MAX_RETRIES - 1) {
          throw new Error(
            "Failed to complete authentication after multiple attempts. " +
            "Please wait a few minutes and try again."
          );
        }
      }
    }

    throw lastError || new Error("Authentication failed after all retries");
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