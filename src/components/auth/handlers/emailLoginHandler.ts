import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL, SUPABASE_KEY } from "@/config/supabase";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

type Toast = {
  title?: string;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: ToastActionElement;
  children?: React.ReactNode;
};

export const handleEmailLogin = async (
  email: string,
  password: string,
  toast: (props: Toast) => void
) => {
  try {
    console.log("Attempting email login for:", email);
    
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('id, email_verified, profile_updated')
      .eq('email', email)
      .maybeSingle();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error("Member lookup error:", memberError);
      throw new Error("Error looking up member details");
    }

    if (!memberData) {
      console.error("No member found with email:", email);
      throw new Error("No member found with this email address. Please check your credentials or use the Member ID login if you haven't updated your profile yet.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      if (error.message === "Email not confirmed") {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/confirm-user-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ email })
        });

        if (!response.ok) {
          console.error("Error verifying email:", await response.text());
          throw new Error("Unable to verify email. Please contact support.");
        }

        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (retryError) {
          if (retryError.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please try again.");
          }
          throw retryError;
        }
      } else if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please try again.");
      } else {
        throw error;
      }
    }

    console.log("Login successful:", data);
    return true;
  } catch (error) {
    console.error("Email login error:", error);
    toast({
      title: "Login failed",
      variant: "destructive",
      children: error instanceof Error ? error.message : "An error occurred during login"
    });
    return false;
  }
};