
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationStatus('error');
        setErrorMessage("Verification token is missing");
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('complete_email_transition' as any, {
            p_token: token
          });

        if (error) throw error;

        // Convert to unknown first, then assert the type
        const result = (data as unknown) as { success: boolean; error?: string };

        if (!result.success) {
          throw new Error(result.error || "Verification failed");
        }

        setVerificationStatus('success');
        
        // Redirect to profile page after 3 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } catch (error: any) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setErrorMessage(error.message || "Failed to verify email");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="container max-w-md mx-auto pt-8">
      <Card className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {verificationStatus === 'verifying' ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Verifying Email</h2>
              <p className="text-muted-foreground">Please wait while we verify your email address...</p>
            </>
          ) : verificationStatus === 'success' ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold text-green-500">Email Verified!</h2>
              <p className="text-muted-foreground">Your email has been successfully verified.</p>
              <p className="text-sm text-muted-foreground">Redirecting to your profile...</p>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold text-destructive">Verification Failed</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => navigate('/profile')} className="mt-4">
                Return to Profile
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmail;
