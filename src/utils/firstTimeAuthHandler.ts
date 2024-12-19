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

    // Generate temporary email with a widely accepted domain
    const tempEmail = `${cleanMemberId.toLowerCase()}@temp-mail.org`;
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
          // Update member record to complete first-time login
          const { error: updateLoginError } = await supabase
            .from('members')
            .update({ 
              first_time_login: false,
              email_verified: true,
              password_changed: false
            })
            .eq('member_number', cleanMemberId);

          if (updateLoginError) {
            console.error("Error updating first time login status:", updateLoginError);
            throw updateLoginError;
          }

          console.log("First time auth successful for member:", cleanMemberId);
          return { success: true };
        }

        if (signUpError.status === 429) {
          console.log(`Rate limit hit, attempt ${retryCount + 1} of ${maxRetries}`);
          const waitTime = baseDelay * Math.pow(2, retryCount);
          await delay(waitTime);
          retryCount++;
          continue;
        }

        throw signUpError;
      } catch (error: any) {
        if (error.status === 429 && retryCount < maxRetries - 1) {
          console.log(`Rate limit hit, attempt ${retryCount + 1} of ${maxRetries}`);
          const waitTime = baseDelay * Math.pow(2, retryCount);
          await delay(waitTime);
          retryCount++;
          continue;
        }
        console.error("Auth error:", error);
        throw error;
      }
    }

    throw new Error("Rate limit exceeded. Please try again in a few minutes.");
  } catch (error) {
    console.error("First time login error:", error);
    throw error;
  }
};