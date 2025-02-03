import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";

export const ResetPassword = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const token = searchParams.get("token");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: member } = await supabase
        .from("members")
        .select("email")
        .eq("member_number", memberNumber)
        .single();

      if (!member?.email) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Member number not found",
        });
        return;
      }

      // Generate reset token
      const { data, error: fnError } = await supabase.rpc(
        "generate_magic_link_token",
        { p_member_number: memberNumber }
      );

      if (fnError) throw fnError;

      // Send reset email
      const { error: emailError } = await supabase.functions.invoke(
        "send-password-reset",
        {
          body: {
            email: member.email,
            memberNumber: memberNumber,
            token: data,
          },
        }
      );

      if (emailError) throw emailError;

      toast({
        title: "Success",
        description: "Password reset instructions have been sent to your email",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset instructions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Validate token
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        "validate_reset_token",
        { token_value: token }
      );

      if (tokenError || !tokenData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid or expired reset token",
        });
        return;
      }

      // Reset password using the correct function
      const { error: resetError } = await supabase.rpc(
        "handle_password_reset_with_token",
        {
          token_value: token,
          new_password: newPassword,
        }
      );

      if (resetError) throw resetError;

      toast({
        title: "Success",
        description: "Password has been reset successfully",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-container">
      <div className="w-full max-w-md glass-card p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {token ? "Reset Password" : "Forgot Password"}
        </h1>

        {!token ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label htmlFor="memberNumber" className="block text-sm mb-2">
                Member Number
              </label>
              <Input
                id="memberNumber"
                type="text"
                placeholder="Enter your member number"
                value={memberNumber}
                onChange={(e) => setMemberNumber(e.target.value)}
                className="bg-black/40"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Instructions"}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => navigate("/")}
                className="text-sm"
              >
                Back to Login
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm mb-2">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-black/40"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/40"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;