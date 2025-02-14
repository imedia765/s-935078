
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/utils/auditLogger";
import type { EmailStatus, EmailTransitionResponse } from "./types";

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
      console.log("Checking email status for member:", memberNum);
      
      const { data, error } = await supabase.rpc(
        'get_member_email_status',
        { p_member_number: memberNum }
      );

      if (error) {
        console.error("RPC error during email status check:", error);
        await logAuditEvent({
          operation: 'update',
          tableName: 'password_reset',
          recordId: memberNum,
          severity: 'error',
          metadata: { error: error.message, step: 'check_email_status' }
        });
        throw error;
      }

      if (!data) {
        console.error("No data returned from email status check");
        throw new Error('No data returned');
      }

      const typedData = (data as unknown) as EmailStatus;
      if (!('success' in typedData)) {
        console.error("Invalid response format:", data);
        throw new Error('Invalid response format');
      }
      
      console.log("Email status check result:", typedData);
      await logAuditEvent({
        operation: 'update',
        tableName: 'password_reset',
        recordId: memberNum,
        severity: 'info',
        metadata: { 
          step: 'check_email_status',
          status: 'success',
          is_temp_email: typedData.is_temp_email 
        }
      });

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

    console.log("Starting member number submission for:", memberNumber);
    setIsLoading(true);
    const status = await checkEmailStatus(memberNumber);
    setIsLoading(false);

    if (!status?.success) {
      console.warn("Member not found:", memberNumber);
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
    console.log("Starting password reset request for member:", memberNumber);

    try {
      const { data: resetResponse, error: resetError } = await supabase.rpc(
        'initiate_email_transition_with_reset',
        {
          p_member_number: memberNumber,
          p_new_email: emailStatus?.is_temp_email ? newEmail : null
        }
      );

      if (resetError) {
        console.error("RPC error during reset initiation:", resetError);
        await logAuditEvent({
          operation: 'update',
          tableName: 'password_reset',
          recordId: memberNumber,
          severity: 'error',
          metadata: { error: resetError.message, step: 'initiate_reset' }
        });
        throw resetError;
      }

      if (!resetResponse) {
        console.error("No response from reset initiation");
        throw new Error('No response from server');
      }

      const typedResponse = (resetResponse as unknown) as EmailTransitionResponse;
      if (!('success' in typedResponse)) {
        console.error("Invalid reset response format:", resetResponse);
        throw new Error('Invalid response format');
      }

      if (!typedResponse.success) {
        throw new Error(typedResponse.error || 'Failed to process reset request');
      }

      console.log("Reset initiation successful, sending email...");

      // Send appropriate email based on whether verification is required
      const { error: emailError } = await supabase.functions.invoke(
        'send-password-reset',
        {
          body: {
            email: typedResponse.email,
            memberNumber: memberNumber,
            token: typedResponse.requires_verification ? 
              typedResponse.verification_token : 
              typedResponse.reset_token,
            isVerification: typedResponse.requires_verification
          },
        }
      );

      if (emailError) {
        console.error("Error sending reset email:", emailError);
        await logAuditEvent({
          operation: 'update',
          tableName: 'password_reset',
          recordId: memberNumber,
          severity: 'error',
          metadata: { error: emailError.message, step: 'send_email' }
        });
        throw emailError;
      }

      console.log("Reset email sent successfully");
      await logAuditEvent({
        operation: 'update',
        tableName: 'password_reset',
        recordId: memberNumber,
        severity: 'info',
        metadata: { 
          step: 'reset_complete',
          requires_verification: typedResponse.requires_verification 
        }
      });

      toast({
        title: typedResponse.requires_verification ? 
          "Verification Email Sent" : 
          "Reset Instructions Sent",
        description: typedResponse.requires_verification ?
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
