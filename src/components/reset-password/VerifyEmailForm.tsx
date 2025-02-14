
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { logAuditEvent } from "@/utils/auditLogger";
import type { EmailVerificationResponse } from "./types";

interface VerifyEmailFormProps {
  verificationToken: string;
}

export const VerifyEmailForm = ({ verificationToken }: VerifyEmailFormProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      console.log("Starting email verification process");
      
      try {
        const { data, error } = await supabase.rpc(
          'verify_email_transition',
          { p_verification_token: verificationToken }
        );

        if (error) {
          console.error("RPC error during email verification:", error);
          await logAuditEvent({
            operation: 'update',
            tableName: 'email_verification',
            recordId: verificationToken,
            severity: 'error',
            metadata: { error: error.message, step: 'verify_email' }
          });
          throw error;
        }

        if (!data) {
          console.error("No response from email verification");
          throw new Error('No response from server');
        }

        const typedData = (data as unknown) as EmailVerificationResponse;
        if (!('success' in typedData)) {
          console.error("Invalid verification response format:", data);
          throw new Error('Invalid response format');
        }

        if (!typedData.success) {
          throw new Error(typedData.error || 'Verification failed');
        }

        console.log("Email verification successful");
        await logAuditEvent({
          operation: 'update',
          tableName: 'email_verification',
          recordId: verificationToken,
          severity: 'info',
          metadata: { step: 'verification_complete' }
        });

        // Show success message
        toast({
          title: "Email Verified",
          description: "Your email has been verified. You can now reset your password.",
        });

        // Redirect to password reset with the new token
        navigate(`/reset-password?token=${typedData.reset_token}`);
      } catch (error: any) {
        console.error('Email verification error:', error);
        await logAuditEvent({
          operation: 'update',
          tableName: 'email_verification',
          recordId: verificationToken,
          severity: 'error',
          metadata: { error: error.message || 'Unknown error', step: 'verification_failed' }
        });
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: error.message || "Failed to verify email. Please try again.",
        });
        navigate('/reset-password');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [verificationToken, toast, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Verifying your email address...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate("/reset-password")}
      >
        Back to Reset Password
      </Button>
    </div>
  );
};
