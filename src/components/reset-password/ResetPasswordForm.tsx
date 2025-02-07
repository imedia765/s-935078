
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResetPasswordFormProps {
  token: string;
}

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText("Password must be at least 8 characters long")}
          >
            Copy
          </Button>
        ),
      });
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please ensure both passwords are identical",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText("Passwords do not match")}
          >
            Copy
          </Button>
        ),
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        "validate_reset_token",
        { token_value: token }
      );

      if (tokenError || !tokenData) {
        const errorMessage = "This password reset link has expired or is invalid. Please request a new one.";
        toast({
          variant: "destructive",
          title: "Invalid Reset Link",
          description: errorMessage,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(errorMessage)}
            >
              Copy
            </Button>
          ),
        });
        setIsLoading(false);
        navigate("/reset-password");
        return;
      }

      const clientInfo = {
        userAgent: window.navigator.userAgent,
        platform: window.navigator.platform,
        language: window.navigator.language,
        timestamp: new Date().toISOString()
      };

      const { error: resetError } = await supabase.rpc(
        "handle_password_reset_with_token",
        {
          token_value: token,
          new_password: newPassword,
          ip_address: window.location.origin,
          user_agent: window.navigator.userAgent,
          client_info: clientInfo
        }
      );

      if (resetError) {
        const errorMessage = resetError.message?.includes("INVALID_TOKEN")
          ? "This password reset link has expired or is invalid. Please request a new one."
          : "Failed to reset password. Please try again or contact support.";
        
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: errorMessage,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(errorMessage)}
            >
              Copy
            </Button>
          ),
        });
        throw resetError;
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully. You can now log in with your new password.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText("Password reset successful")}
          >
            Copy
          </Button>
        ),
      });
      navigate("/");
    } catch (error: any) {
      console.error("Password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div>
        <label htmlFor="newPassword" className="block text-sm mb-2">
          New Password
        </label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Enter new password (minimum 8 characters)"
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Resetting Password..." : "Reset Password"}
      </Button>
    </form>
  );
};
