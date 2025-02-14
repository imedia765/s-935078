
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailStatus {
  success: boolean;
  member_number?: string;
  email?: string;
  is_temp_email?: boolean;
  has_auth_id?: boolean;
  error?: string;
}

interface PasswordResetResponse {
  success: boolean;
  token?: string;
  email?: string;
  error?: string;
  transition_id?: string;
}

export const RequestResetForm = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to check member's email status
  const checkEmailStatus = async (memberNum: string) => {
    try {
      const { data, error } = await supabase.rpc(
        'get_member_email_status',
        { p_member_number: memberNum }
      );

      if (error) throw error;

      const typedData = data as unknown as EmailStatus;
      setEmailStatus(typedData);
      return typedData;
    } catch (error: any) {
      console.error('Email status check error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to check email status",
      });
      return null;
    }
  };

  const handleMemberNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberNumber.trim()) return;

    setIsLoading(true);
    const status = await checkEmailStatus(memberNumber);
    setIsLoading(false);

    if (!status?.success) {
      toast({
        variant: "destructive",
        title: "Member Not Found",
        description: "No member found with this member number",
      });
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: resetResponse, error: resetError } = await supabase.rpc(
        'handle_password_reset_request',
        {
          p_member_number: memberNumber,
          p_email: email,
          p_new_email: emailStatus?.is_temp_email ? newEmail : null
        }
      );

      if (resetError) throw resetError;

      const typedResetResponse = resetResponse as unknown as PasswordResetResponse;
      if (!typedResetResponse.success) {
        throw new Error(typedResetResponse.error || 'Failed to process reset request');
      }

      // Send reset email using Loops
      const { error: emailError } = await supabase.functions.invoke(
        'send-password-reset',
        {
          body: {
            email: typedResetResponse.email,
            memberNumber: memberNumber,
            token: typedResetResponse.token
          },
        }
      );

      if (emailError) throw emailError;

      toast({
        title: "Reset Instructions Sent",
        description: "Please check your email for password reset instructions. The link will expire in 1 hour.",
      });
      
      setMemberNumber("");
      setEmail("");
      setNewEmail("");
      setEmailStatus(null);
    } catch (error: any) {
      console.error("Password reset request error:", error);
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: error.message || "Failed to send reset instructions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show member number input only if email status is not checked
  if (!emailStatus) {
    return (
      <form onSubmit={handleMemberNumberSubmit} className="space-y-4">
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Checking..." : "Continue"}
        </Button>

        <div className="text-center">
          <Button variant="link" onClick={() => navigate("/")} className="text-sm">
            Back to Login
          </Button>
        </div>
      </form>
    );
  }

  // Show email form based on email status
  return (
    <form onSubmit={handleRequestReset} className="space-y-4">
      <div>
        <label htmlFor="memberNumber" className="block text-sm mb-2">
          Member Number
        </label>
        <Input
          id="memberNumber"
          type="text"
          value={memberNumber}
          className="bg-black/40"
          disabled
        />
      </div>

      {emailStatus.is_temp_email ? (
        // Temp email case - show new email input
        <div>
          <label htmlFor="newEmail" className="block text-sm mb-2">
            New Personal Email Address
          </label>
          <Input
            id="newEmail"
            type="email"
            placeholder="Enter your personal email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="bg-black/40"
            disabled={isLoading}
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            You currently have a temporary email. Please enter your personal email address.
          </p>
        </div>
      ) : (
        // Personal email case - must match existing
        <div>
          <label htmlFor="email" className="block text-sm mb-2">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your registered email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black/40"
            disabled={isLoading}
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            Please enter your registered email address exactly as it appears in your records.
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending Instructions..." : "Send Reset Instructions"}
      </Button>

      <div className="text-center">
        <Button 
          variant="link" 
          onClick={() => {
            setEmailStatus(null);
            setEmail("");
            setNewEmail("");
          }} 
          className="text-sm"
        >
          Use Different Member Number
        </Button>
      </div>

      <div className="text-center">
        <Button variant="link" onClick={() => navigate("/")} className="text-sm">
          Back to Login
        </Button>
      </div>
    </form>
  );
};
