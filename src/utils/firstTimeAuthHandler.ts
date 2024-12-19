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

    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      try {
        // First try to sign in in case user exists
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: cleanMemberId
        });

        if (!signInError) {
          // User exists and signed in successfully
          await updateMemberStatus(cleanMemberId);
          return { success: true };
        }

        // If sign in failed because user doesn't exist, try signup
        console.log(`Attempting signup for: ${tempEmail}`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: tempEmail,
          password: cleanMemberId,
          options: {
            data: {
              member_number: cleanMemberId
            }
          }
        });

        if (!signUpError) {
          // Wait a bit for the signup to process
          await delay(1000);

          // For first-time login, we'll automatically confirm the email
          const { data: adminAuthData, error: adminAuthError } = await supabase.functions.invoke('confirm-user-email', {
            body: { email: tempEmail }
          });

          if (adminAuthError) {
            console.error("Error confirming email:", adminAuthError);
            throw adminAuthError;
          }

          // Now try to sign in again
          const { error: finalSignInError } = await supabase.auth.signInWithPassword({
            email: tempEmail,
            password: cleanMemberId
          });

          if (finalSignInError) {
            console.error("Error signing in after confirmation:", finalSignInError);
            throw finalSignInError;
          }

          await updateMemberStatus(cleanMemberId);
          return { success: true };
        }

        // Handle rate limit error
        if (signUpError.status === 429) {
          if (retryCount < maxRetries - 1) {
            const waitTime = baseDelay * Math.pow(2, retryCount);
            console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
            await delay(waitTime);
            retryCount++;
            continue;
          }
          throw new Error("Rate limit exceeded. Please try again in a few minutes.");
        }

        throw signUpError;
      } catch (error: any) {
        if (error?.status === 429 && retryCount < maxRetries - 1) {
          const waitTime = baseDelay * Math.pow(2, retryCount);
          console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
          await delay(waitTime);
          retryCount++;
          continue;
        }
        throw error;
      }
    }

    throw new Error("Failed to authenticate after multiple attempts. Please try again later.");
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