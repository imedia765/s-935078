import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function FirstTimeLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');

  const handleFirstTimeLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const cleanMemberId = memberId.toUpperCase().trim();
    console.log("First time login attempt with member ID:", cleanMemberId);

    try {
      // First, check if the member exists and get their details
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, email, password_changed, member_number, auth_user_id')
        .eq('member_number', cleanMemberId)
        .maybeSingle();

      if (memberError) {
        console.error('Member lookup error:', memberError);
        throw new Error("Error checking member status. Please try again.");
      }

      if (!member) {
        throw new Error(`No member found with ID ${cleanMemberId}. Please check your credentials.`);
      }

      // Check if this is actually a first-time login
      if (member.password_changed) {
        throw new Error("This member has already updated their password. Please use the regular login page.");
      }

      // Check if member already has an auth_user_id
      if (member.auth_user_id) {
        throw new Error("This member is already linked to an account. Please use the regular login page.");
      }

      // Verify the password matches the member ID for first-time login
      if (password !== cleanMemberId) {
        throw new Error("For first-time login, your password must be the same as your Member ID.");
      }

      // Generate the temporary email
      const tempEmail = `${cleanMemberId.toLowerCase()}@temp.pwaburton.org`;
      console.log("Attempting first-time login with:", { email: tempEmail, memberId: cleanMemberId });

      // Try to sign up first (in case this is the first time)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: tempEmail,
        password: cleanMemberId,
        options: {
          data: {
            member_number: cleanMemberId
          }
        }
      });

      if (signUpError && !signUpError.message.includes('User already registered')) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }

      // Now try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: cleanMemberId
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      // Update the member record to link it with the auth user
      if (signInData.user) {
        const { error: updateError } = await supabase
          .from('members')
          .update({
            auth_user_id: signInData.user.id,
            first_time_login: false
          })
          .eq('id', member.id);

        if (updateError) {
          console.error("Error updating member:", updateError);
          throw new Error("Failed to link your account. Please contact support.");
        }

        console.log("Successfully linked member to auth user:", {
          memberId: member.id,
          authUserId: signInData.user.id
        });
      }

      toast({
        title: "Login successful",
        description: "Welcome! Please update your password.",
      });
      
      navigate('/change-password');
    } catch (error) {
      console.error("First time login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
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
          <CardTitle className="text-2xl text-center">First Time Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-blue-700">
              For your first login, use your Member ID (e.g. TM20001) as both your username and password.
              You'll be prompted to update your password after logging in.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleFirstTimeLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="memberId"
                name="memberId"
                type="text"
                placeholder="Member ID (e.g. TM20001)"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                required
                disabled={isLoading}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password (same as Member ID)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "First Time Login"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Already updated your password?
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Back to Regular Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}