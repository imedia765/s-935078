import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const cleanMemberId = memberId.toUpperCase().trim();
    console.log("Login attempt with member ID:", cleanMemberId);

    try {
      // First, get the member details
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, email, password_changed, member_number, default_password_hash')
        .eq('member_number', cleanMemberId)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!member) throw new Error("Invalid Member ID. Please check your credentials.");

      const tempEmail = `${cleanMemberId.toLowerCase()}@temp.pwaburton.org`;
      console.log("Attempting login with temp email:", tempEmail);

      // Try to sign up first (in case this is first time)
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: tempEmail,
          password: password,
        });
        
        if (signUpError && !signUpError.message.includes('User already registered')) {
          throw signUpError;
        }
      } catch (signUpError) {
        console.log("Sign up attempt (expected to fail if user exists):", signUpError);
      }

      // Now attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error("Invalid Member ID or password. Please check your credentials.");
        }
        throw signInError;
      }

      console.log("Login successful:", data);

      // Update auth_user_id if not set
      if (data.user && member.id) {
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            auth_user_id: data.user.id,
            email_verified: true,
            profile_updated: true
          })
          .eq('id', member.id);

        if (updateError) {
          console.error("Error updating member:", updateError);
        }
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      if (!member.password_changed) {
        navigate("/change-password");
      } else {
        navigate("/admin/profile");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please check your Member ID and password.",
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
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-blue-700">
              Enter your Member ID and password to login. If you haven't changed your password yet,
              use your Member ID as both username and password.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}