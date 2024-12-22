import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        .select('id, email, password_changed, member_number')
        .eq('member_number', cleanMemberId)
        .single();

      if (memberError) {
        console.error("Member lookup error:", memberError);
        throw new Error("Error checking member status");
      }

      if (!member) {
        throw new Error("Invalid Member ID. Please check your credentials.");
      }

      const tempEmail = `${cleanMemberId.toLowerCase()}@temp.pwaburton.org`;
      console.log("Attempting login with temp email:", tempEmail);

      // Attempt to sign in
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error("Invalid Member ID or password. Please check your credentials and try again.");
        }
        throw signInError;
      }

      if (!authData.user) {
        throw new Error("Login failed. Please try again.");
      }

      console.log("Login successful:", authData);

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
              <input
                id="memberId"
                name="memberId"
                type="text"
                placeholder="Member ID (e.g. TM20001)"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border rounded-md uppercase bg-background"
              />
            </div>
            <div className="space-y-2">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}