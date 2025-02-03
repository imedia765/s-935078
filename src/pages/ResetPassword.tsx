import { useSearchParams } from "react-router-dom";
import { Instructions } from "@/components/reset-password/Instructions";
import { RequestResetForm } from "@/components/reset-password/RequestResetForm";
import { ResetPasswordForm } from "@/components/reset-password/ResetPasswordForm";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-container">
      <div className="w-full max-w-md glass-card p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {token ? "Reset Password" : "Forgot Password"}
        </h1>

        <Instructions isReset={!!token} />

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <RequestResetForm />
        )}
      </div>
    </div>
  );
};

export default ResetPassword;