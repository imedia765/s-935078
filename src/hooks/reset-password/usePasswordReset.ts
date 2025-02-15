
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/utils/auditLogger";
import type { EmailTransitionResponse } from "@/components/reset-password/types";

interface ResetFlowParams {
  p_member_number: string;
  p_new_email: string | null;
  p_ip_address: string;
  p_user_agent: string;
}

export const usePasswordReset = () => {
  const { toast } = useToast();

  const initiatePasswordReset = async (
    memberNumber: string,
    newEmail: string | null,
    isTemporaryEmail: boolean
  ) => {
    try {
      const { data: response, error: resetError } = await supabase.rpc(
        'initiate_password_reset_flow',
        {
          p_member_number: memberNumber,
          p_new_email: isTemporaryEmail ? newEmail : null,
          p_ip_address: window.location.hostname,
          p_user_agent: window.navigator.userAgent
        }
      );

      if (resetError) {
        console.error("RPC error during reset initiation:", resetError);
        await logAuditEvent({
          operation: 'update',
          tableName: 'password_reset',
          recordId: memberNumber,
          severity: 'error',
          metadata: { 
            error: resetError.message, 
            step: 'initiate_reset',
            event_type: 'reset_initiation_failed',
            origin: window.location.origin
          }
        });
        throw resetError;
      }

      const resetResponse = response as EmailTransitionResponse;
      if (!resetResponse) {
        console.error("No response from reset initiation");
        throw new Error('No response from server');
      }

      if (!resetResponse.success) {
        if (resetResponse.code === 'RATE_LIMIT_EXCEEDED') {
          const remainingTime = Math.ceil(parseInt(resetResponse.remaining_time || '0') / 60);
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: `Please wait ${remainingTime} minutes before trying again.`,
          });
          return false;
        }
        throw new Error(resetResponse.error || 'Failed to process reset request');
      }

      console.log("Reset initiation successful, sending email...");

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

      if (emailError) {
        console.error("Error sending reset email:", emailError);
        
        await logAuditEvent({
          operation: 'update',
          tableName: 'password_reset',
          recordId: memberNumber,
          severity: 'error',
          metadata: { 
            error: emailError.message, 
            step: 'send_email',
            event_type: 'reset_email_failed',
            origin: window.location.origin
          }
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
          requires_verification: resetResponse.requires_verification,
          event_type: 'reset_email_sent',
          origin: window.location.origin
        }
      });

      toast({
        title: resetResponse.requires_verification ? 
          "Verification Email Sent" : 
          "Reset Instructions Sent",
        description: resetResponse.requires_verification ?
          "Please check your email to verify your new email address." :
          "Please check your email for password reset instructions. The link will expire in 1 hour.",
      });

      return true;
    } catch (error: any) {
      console.error("Password reset request error:", error);
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: error.message || "Failed to send reset instructions. Please try again.",
      });
      return false;
    }
  };

  return { initiatePasswordReset };
};
