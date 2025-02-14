
import { useSearchParams } from "react-router-dom";
import { Instructions } from "@/components/reset-password/Instructions";
import { RequestResetForm } from "@/components/reset-password/RequestResetForm";
import { ResetPasswordForm } from "@/components/reset-password/ResetPasswordForm";
import { VerifyEmailForm } from "@/components/reset-password/VerifyEmailForm";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const verifyToken = searchParams.get("verify");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-container">
      <div className="w-full max-w-md glass-card p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {resetToken ? "Reset Password" : verifyToken ? "Verify Email" : "Forgot Password"}
        </h1>

        <Instructions isReset={!!resetToken} isVerification={!!verifyToken} />

        {verifyToken ? (
          <VerifyEmailForm verificationToken={verifyToken} />
        ) : resetToken ? (
          <ResetPasswordForm token={resetToken} />
        ) : (
          <RequestResetForm />
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
