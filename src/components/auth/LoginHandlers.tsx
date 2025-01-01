import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMemberByMemberId } from "@/utils/memberAuth";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    const cleanMemberId = memberId.toUpperCase().trim();
    console.log("Attempting login with member_number:", cleanMemberId);
    
    // First, look up the member
    const member = await getMemberByMemberId(cleanMemberId);
    
    if (!member) {
      console.error("Member lookup failed:", { member_number: cleanMemberId });
      throw new Error("Invalid member ID");
    }

    console.log("Found member:", member);

    // Use member number for authentication
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: `${cleanMemberId}@temp.pwaburton.org`,
      password: cleanMemberId
    });

    if (signInError) {
      console.error('Sign in failed:', signInError);
      throw new Error("Invalid credentials");
    }

    if (!signInData?.user) {
      throw new Error("Login failed");
    }

    // Update member record if needed
    const { error: updateError } = await supabase
      .from('members')
      .update({ 
        auth_user_id: signInData.user.id,
        email_verified: true,
        email: `${cleanMemberId}@temp.pwaburton.org`,
        profile_updated: true
      })
      .eq('member_number', cleanMemberId)
      .is('auth_user_id', null); // Only update if auth_user_id is null

    if (updateError) {
      console.error('Error updating member record:', updateError);
      // Continue anyway since the user is authenticated
    }

    console.log("Login successful");
    navigate("/admin");

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}