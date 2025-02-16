
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X } from "lucide-react";
import type { RPCResponse } from "@/components/reset-password/types";

interface ResetPasswordFormProps {
  token: string;
}

interface PasswordRequirement {
  regex: RegExp;
  message: string;
}

const passwordRequirements: PasswordRequirement[] = [
  { regex: /.{8,}/, message: "At least 8 characters" },
  { regex: /[A-Z]/, message: "One uppercase letter" },
  { regex: /[a-z]/, message: "One lowercase letter" },
  { regex: /[0-9]/, message: "One number" },
  { regex: /[@$!%*?&]/, message: "One special character (@$!%*?&)" },
];

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePassword = () => {
    return passwordRequirements.every((requirement) => 
      requirement.regex.test(newPassword)
    );
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Please ensure your password meets all requirements.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please ensure both passwords are identical.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First validate the token and get user info
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        "validate_reset_token",
        { p_reset_token: token }
      );

      const validatedData = tokenData as unknown as RPCResponse;
      
      if (tokenError || !validatedData?.success) {
        throw new Error("This password reset link has expired or is invalid. Please request a new one.");
      }

      // Use Supabase Auth API to update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Mark token as used and log the change
      const clientInfo = {
        userAgent: window.navigator.userAgent,
        platform: window.navigator.platform,
        language: window.navigator.language,
        timestamp: new Date().toISOString()
      };

      // Finalize the password reset
      const { data: finalizeData, error: finalizeError } = await supabase.rpc(
        'finalize_password_reset',
        {
          token_value: token,
          ip_address: window.location.hostname,
          user_agent: window.navigator.userAgent,
          client_info: clientInfo
        }
      );

      if (finalizeError) {
        console.error("Error finalizing password reset:", finalizeError);
        // Don't throw here as password is already updated
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully. You can now log in with your new password.",
      });
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to reset password. Please try again or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirementItem = ({ requirement, isMet }: { requirement: string; isMet: boolean }) => (
    <div className="flex items-center space-x-2">
      {isMet ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      )}
      <span className={isMet ? "text-green-500" : "text-red-500"}>{requirement}</span>
    </div>
  );

  return (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div className="space-y-4">
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
            onFocus={() => setShowRequirements(true)}
            className="bg-black/40"
            disabled={isLoading}
          />
        </div>

        {showRequirements && (
          <div className="p-4 bg-background/50 rounded-lg space-y-2">
            <h3 className="text-sm font-medium mb-2">Password Requirements:</h3>
            {passwordRequirements.map((req, index) => (
              <PasswordRequirementItem
                key={index}
                requirement={req.message}
                isMet={req.regex.test(newPassword)}
              />
            ))}
          </div>
        )}

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
            className={`bg-black/40 ${
              confirmPassword && newPassword !== confirmPassword
                ? "border-red-500"
                : ""
            }`}
            disabled={isLoading}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !validatePassword() || newPassword !== confirmPassword}
      >
        {isLoading ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting Password...
          </span>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );
};
