import { supabase } from "@/integrations/supabase/client";
import { ToastType } from "@/hooks/use-toast";

export const handleMemberIdLogin = async (
  memberId: string,
  password: string,
  { toast }: ToastType
) => {
  try {
    console.log("Attempting member ID login for:", memberId);

    // First get the member's email using member number
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('email, full_name, first_time_login')
      .eq('member_number', memberId)
      .maybeSingle();

    if (memberError) {
      console.error("Member lookup error:", memberError);
      throw new Error("Error looking up member");
    }

    if (!memberData) {
      console.error("Member not found:", memberId);
      throw new Error(`No member found with ID ${memberId}`);
    }

    // For first time login, use the temporary email format
    const loginEmail = memberData.first_time_login 
      ? `${memberId.toLowerCase()}@temp.pwaburton.org`
      : memberData.email;

    if (!loginEmail) {
      throw new Error("No valid email found for this member");
    }

    console.log("Attempting login with email:", loginEmail);

    // Sign in with email and password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });

    if (signInError) {
      console.error("Sign in error:", signInError);
      if (signInError.message.includes("Invalid login credentials")) {
        throw new Error("Invalid password. For first-time login, use your Member ID as the password.");
      }
      throw signInError;
    }

    if (!signInData.user) {
      throw new Error("No user data returned after login");
    }

    console.log("User signed in successfully:", signInData.user.id);

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error checking profile:", profileError);
      throw profileError;
    }

    // If no profile exists, create one
    if (!existingProfile) {
      console.log("Creating new profile for user:", signInData.user.id);
      
      const { error: createError } = await supabase.rpc(
        'create_profile',
        {
          p_id: signInData.user.id,
          p_email: loginEmail,
          p_user_id: signInData.user.id
        }
      );

      if (createError) {
        console.error("Error creating profile:", createError);
        throw createError;
      }
    }

    return true;
  } catch (error) {
    console.error("Login process error:", error);
    toast({
      title: "Login failed",
      description: error instanceof Error ? error.message : "An error occurred during login",
      variant: "destructive",
    });
    return false;
  }
};