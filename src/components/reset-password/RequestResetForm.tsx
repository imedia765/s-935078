import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { EmailStatus, EmailTransitionResponse } from "./types";

interface EmailStatus {
  success: boolean;
  member_number?: string;
  email?: string;
  is_temp_email?: boolean;
  has_auth_id?: boolean;
  error?: string;
}

export const RequestResetForm = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkEmailStatus = async (memberNum: string) => {
    try {
      const { data, error } = await supabase.rpc<EmailStatus, { p_member_number: string }>(
        'get_member_email_status',
        { p_member_number: memberNum }
      );

      if (error) throw error;

      if (!data) throw new Error('No data returned');

      setEmailStatus(data);
      return data;
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
      const { data: resetResponse, error: resetError } = await supabase.rpc<
        EmailTransitionResponse,
        { p_member_number: string; p_new_email: string | null }
      >(
        'initiate_email_transition_with_reset',
        {
          p_member_number: memberNumber,
          p_new_email: emailStatus?.is_temp_email ? newEmail : null
        }
      );

      if (resetError) throw resetError;
      if (!resetResponse) throw new Error('No response from server');

      if (!resetResponse.success) {
        throw new Error(resetResponse.error || 'Failed to process reset request');
      }

      // Send appropriate email based on whether verification is required
      const { error: emailError } = await supabase.functions.invoke(
        'send-password-reset',
        {
          body: {
            email: resetResponse.email,
            memberNumber: memberNumber,
            token: resetResponse.requires_verification ? 
              resetResponse.verification_token : 
              resetResponse.reset_token,
            isVerification: resetResponse.requires_verification
          },
        }
      );

      if (emailError) throw emailError;

      toast({
        title: resetResponse.requires_verification ? 
          "Verification Email Sent" : 
          "Reset Instructions Sent",
        description: resetResponse.requires_verification ?
          "Please check your email to verify your new email address." :
          "Please check your email for password reset instructions. The link will expire in 1 hour.",
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
