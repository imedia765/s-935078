import { supabase } from "@/integrations/supabase/client";
import type { ToastActionElement } from "@/components/ui/toast";

type Toast = {
  title?: string;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: ToastActionElement;
};

interface MemberResponse {
  id: string;
  email: string;
  member_number: string;
  profile_updated: boolean;
  password_changed: boolean;
  full_name: string;
}

export const handleMemberIdLogin = async (
  memberId: string,
  password: string,
  toast: (props: Toast) => void
) => {
  try {
    console.log("Starting member ID login process for:", memberId);
    
    // Step 1: Check if member exists with retries
    const getMemberWithRetry = async (retries = 3): Promise<MemberResponse | null> => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`Attempt ${i + 1} to fetch member ${memberId}`);
          
          const { data, error } = await supabase
            .from('members')
            .select('id, email, member_number, profile_updated, password_changed, full_name')
            .eq('member_number', memberId)
            .maybeSingle();
          
          if (!error && data) {
            console.log("Member found:", data);
            return data as MemberResponse;
          }
          
          if (error) {
            console.log(`Retry ${i + 1} failed:`, error);
            if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Retry ${i + 1} error:`, error);
          if (i === retries - 1) throw error;
        }
      }
      return null;
    };

    const existingMember = await getMemberWithRetry();

    if (!existingMember) {
      console.error("No member found with ID:", memberId);
      throw new Error("Invalid Member ID");
    }

    // Step 2: Sign out any existing session to ensure clean state
    await supabase.auth.signOut();
    console.log("Cleared existing session");

    // Step 3: Try to sign in with the provided credentials
    console.log("Attempting to sign in with email:", existingMember.email);
    let signInResult = await supabase.auth.signInWithPassword({
      email: existingMember.email,
      password: existingMember.profile_updated ? password : memberId.toUpperCase(),
    });

    // If sign in fails and user hasn't updated their profile, try to create the account
    if (signInResult.error && !existingMember.profile_updated) {
      console.log("Sign in failed, attempting to create new user account");

      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email: existingMember.email,
        password: memberId.toUpperCase(),
        options: {
          data: {
            full_name: existingMember.full_name
          }
        }
      });

      if (signUpError) {
        console.error("Error creating user account:", signUpError);
        throw new Error("Failed to create user account");
      }

      // Wait for account creation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try signing in again after creating the account
      signInResult = await supabase.auth.signInWithPassword({
        email: existingMember.email,
        password: memberId.toUpperCase(),
      });

      if (signInResult.error) {
        console.error("Error signing in after account creation:", signInResult.error);
        throw new Error("Failed to sign in");
      }
    } else if (signInResult.error) {
      console.error("Sign in error:", signInResult.error);
      throw new Error("Invalid Member ID or password");
    }

    // Step 4: Verify we have a valid session
    if (!signInResult.data.session) {
      throw new Error("No session after sign in");
    }

    console.log("Successfully signed in, checking for existing profile");

    // Step 5: Check for existing profile and create if needed
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', signInResult.data.session.user.id)
      .maybeSingle();

    if (!existingProfile) {
      console.log("Profile not found, creating from member data");
      
      // Insert directly into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: existingMember.id,
          email: existingMember.email,
          user_id: signInResult.data.session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Continue even if profile creation fails - we can try again later
        console.log("Continuing despite profile creation error");
      } else {
        console.log("Profile created successfully");
      }
    }

    console.log("Login successful for member:", memberId);
    return true;
  } catch (error) {
    console.error("Member ID login error:", error);
    toast({
      title: "Login failed",
      description: error instanceof Error ? error.message : "Invalid Member ID or password",
      variant: "destructive",
    });
    return false;
  }
};