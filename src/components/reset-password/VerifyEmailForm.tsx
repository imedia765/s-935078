
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface VerifyEmailFormProps {
  verificationToken: string;
}

export const VerifyEmailForm = ({ verificationToken }: VerifyEmailFormProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const { data, error } = await supabase.rpc(
          'verify_email_transition',
          { p_verification_token: verificationToken }
        );

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'Verification failed');
        }

        // Show success message
        toast({
          title: "Email Verified",
          description: "Your email has been verified. You can now reset your password.",
        });

        // Redirect to password reset with the new token
        navigate(`/reset-password?token=${data.reset_token}`);
      } catch (error: any) {
        console.error('Email verification error:', error);
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
