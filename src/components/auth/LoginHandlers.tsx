import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getMemberByMemberId } from "@/utils/memberAuth";

export const useLoginHandlers = (setIsLoggedIn: (value: boolean) => void) => {
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      console.log("Attempting email login with:", { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Email login error:", error);
        throw error;
      }

      console.log("Login successful:", data);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Email login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  const handleMemberIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const memberId = (formData.get("memberId") as string).toUpperCase().trim();
    const password = formData.get("password") as string;

    try {
      console.log("Attempting member ID login for:", memberId);
      const member = await getMemberByMemberId(memberId);

      if (!member) {
        throw new Error("Member ID not found");
      }

      // For first time login
      if (member.first_time_login) {
        console.log("First time login detected for member:", memberId);

        // Check if member has an email
        if (!member.email) {
          throw new Error("Email address required for registration. Please contact support.");
        }

        // Try signing in first in case user already exists
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: member.email,
          password,
        });

        if (!signInError) {
          console.log("Existing user found and signed in:", signInData);
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
          setIsLoggedIn(true);
          return;
        }

        // If sign in failed, create new user with member's email
        console.log("Creating new auth user with email:", member.email);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: member.email,
          password,
          options: {
            data: {
              member_id: member.id,
              member_number: member.member_number
            }
          }
        });

        if (signUpError) {
          console.error("Sign up error:", signUpError);
          throw signUpError;
        }

        // Attempt immediate login after signup
        const { error: newSignInError } = await supabase.auth.signInWithPassword({
          email: member.email,
          password,
        });

        if (newSignInError) {
          console.error("Post-signup sign in error:", newSignInError);
          throw newSignInError;
        }

        toast({
          title: "First-time login successful",
          description: "Please complete your profile setup",
        });
        setIsLoggedIn(true);
        return;
      }

      // For returning users
      if (!member.email) {
        throw new Error("No email associated with this member");
      }

      console.log("Attempting login with email:", member.email);
      const { error } = await supabase.auth.signInWithPassword({
        email: member.email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        throw error;
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Login process error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid Member ID or password",
        variant: "destructive",
      });
    }
  };

  return {
    handleEmailSubmit,
    handleMemberIdSubmit,
  };
};