import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const LoginForm = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Starting login process with member number:", memberNumber);

    try {
      // First verify member credentials using RPC
      const { data: memberData, error: rpcError } = await supabase.rpc('authenticate_member', {
        p_member_number: memberNumber,
        p_password: password
      });

      if (rpcError) {
        console.error("RPC Error:", rpcError);
        throw new Error('Invalid credentials');
      }

      if (!memberData || memberData.length === 0) {
        console.error("No member data returned");
        throw new Error('Invalid credentials');
      }

      console.log("Member authenticated:", memberData);

      // Clear any existing sessions first
      await supabase.auth.signOut();

      // Try to sign in with member number as email
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: `${memberNumber}@member.com`,
        password: memberNumber
      });

      if (signInError) {
        console.log("Sign in failed, attempting to create account...");
        
        // If sign in fails, create the account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${memberNumber}@member.com`,
          password: memberNumber,
          options: {
            data: {
              member_number: memberNumber,
              role: memberData[0].role,
            }
          }
        });

        if (signUpError) {
          console.error("Sign up error:", signUpError);
          throw new Error('Failed to create account');
        }

        console.log("Account created successfully");

        // Update the member record with the new auth_user_id
        const { error: updateError } = await supabase
          .from('members')
          .update({ auth_user_id: signUpData.user?.id })
          .eq('member_number', memberNumber);

        if (updateError) {
          console.error("Failed to update auth_user_id:", updateError);
          // Continue anyway as the member can still log in
        }

        // Try signing in again after account creation
        const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
          email: `${memberNumber}@member.com`,
          password: memberNumber
        });

        if (finalSignInError) {
          console.error("Final sign in error:", finalSignInError);
          throw new Error('Failed to sign in after account creation');
        }

        console.log("Final sign in successful");
      } else {
        console.log("Direct sign in successful");
        // Update the member record with the auth_user_id if not already set
        const { error: updateError } = await supabase
          .from('members')
          .update({ auth_user_id: signInData.user?.id })
          .eq('member_number', memberNumber)
          .is('auth_user_id', null);

        if (updateError) {
          console.error("Failed to update auth_user_id:", updateError);
          // Continue anyway as the member can still log in
        }
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="memberNumber">Member Number</Label>
        <Input
          id="memberNumber"
          type="text"
          value={memberNumber}
          onChange={(e) => setMemberNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};