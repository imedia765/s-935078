
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

    // Validate password length
    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 8 characters long",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText("Password must be at least 8 characters long");
            }}
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
        title: "Error",
        description: "Passwords do not match",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText("Passwords do not match");
            }}
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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid or expired reset token",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText("Invalid or expired reset token");
              }}
            >
              Copy
            </Button>
          ),
        });
        return;
      }

      const { error: resetError } = await supabase.rpc(
        "handle_password_reset_with_token",
        {
          token_value: token,
          new_password: newPassword,
        }
      );

      if (resetError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: resetError.message || "Failed to reset password",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(resetError.message || "Failed to reset password");
              }}
            >
              Copy
            </Button>
          ),
        });
        throw resetError;
      }

      toast({
        title: "Success",
        description: "Password has been reset successfully",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText("Password has been reset successfully");
            }}
          >
            Copy
          </Button>
        ),
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(error.message || "Failed to reset password");
            }}
          >
            Copy
          </Button>
        ),
      });
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
        {isLoading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
};
