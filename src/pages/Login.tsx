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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Login attempt with:", { identifier });

    try {
      // Check if input is an email or member ID
      const isEmail = identifier.includes('@') && !identifier.includes('@temp.pwaburton.org');
      
      if (isEmail) {
        // Check if member has updated their password
        const { data: member } = await supabase
          .from('members')
          .select('password_changed, email_verified')
          .eq('email', identifier)
          .single();

        if (!member?.password_changed) {
          toast({
            title: "Password not updated",
            description: "Please use the 'First Time Login' button below if you haven't changed your password yet.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Attempt login
      const { error } = await supabase.auth.signInWithPassword({
        email: isEmail ? identifier : `${identifier}@temp.pwaburton.org`,
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Redirect to admin/profile after successful login
      navigate("/admin/profile");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please check your email/member ID and password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirstTimeLogin = () => {
    navigate('/first-time-login');
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
              Enter your email if you've already updated your profile, or your Member ID if this is your first time logging in.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="Email or Member ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={isLoading}
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                First time here?
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleFirstTimeLogin}
          >
            First Time Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}