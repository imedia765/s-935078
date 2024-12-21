import { useState } from "react";
import { LoginTabs } from "../components/auth/LoginTabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { getMemberByMemberId } from "../utils/memberAuth";
import { supabase } from "../integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      console.log("Attempting email login with:", { email });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      navigate('/admin');
    } catch (error) {
      console.error("Email login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setShowEmailConfirmation(false);
    
    const formData = new FormData(e.currentTarget);
    const memberId = formData.get('memberId') as string;
    const password = formData.get('password') as string;
    
    try {
      console.log("Looking up member with ID:", memberId);
      const member = await getMemberByMemberId(memberId);
      console.log("Member lookup result:", member);

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

        // Create new auth user with member's email
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
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: member.email,
          password,
        });

        if (signInError) {
          console.error("Post-signup sign in error:", signInError);
          throw signInError;
        }

        toast({
          title: "First-time login successful",
          description: "Please complete your profile setup",
        });
        navigate('/admin/profile');
        return;
      }

      // For returning users
      if (!member.email) {
        throw new Error("No email associated with this member");
      }

      console.log("Attempting login with email:", member.email);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: member.email,
        password,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        throw signInError;
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate('/admin');

    } catch (error) {
      console.error("Member ID login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid member ID or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          {showEmailConfirmation && (
            <Alert className="mb-6">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Please check your email for a confirmation link before logging in.
                You may need to check your spam folder.
              </AlertDescription>
            </Alert>
          )}
          <LoginTabs 
            onEmailSubmit={handleEmailSubmit}
            onMemberIdSubmit={handleMemberIdSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}