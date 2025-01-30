import { useLoginForm } from './login/useLoginForm';
import MemberNumberInput from './login/MemberNumberInput';
import PasswordInput from './login/PasswordInput';
import LoginButton from './login/LoginButton';
import LegalLinks from './login/LegalLinks';
import { ForgotPasswordButton } from './login/ForgotPasswordButton';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MessageSquare } from "lucide-react";

const LoginForm = () => {
  const { memberNumber, password, setMemberNumber, setPassword, loading, handleLogin, error } = useLoginForm();

  return (
    <div className="bg-dashboard-card rounded-lg shadow-lg p-8 mb-12">
      {/* WhatsApp Support Notice */}
      <div className="mb-6 bg-dashboard-softGreen border border-dashboard-accent3/20 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <MessageSquare className="h-5 w-5 text-dashboard-accent3" />
          <div className="text-dashboard-dark">
            <p className="text-sm font-medium mb-2">
              Need assistance? Contact Support via WhatsApp
            </p>
            <p className="text-xs text-dashboard-dark/80 mb-2">
              When messaging, please include your full name, member number, and a brief description of your issue for faster assistance
            </p>
            <p className="text-xs text-dashboard-dark/80 mb-2">
              Note: Our WhatsApp support is dedicated to app-related inquiries only. For all other matters, please reach out to your collector directly.
            </p>
            <a 
              href="https://wa.me/447476816917"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-dashboard-accent3 hover:text-dashboard-accent3/80 font-semibold transition-colors"
            >
              Open WhatsApp Chat →
            </a>
          </div>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <MemberNumberInput
          memberNumber={memberNumber}
          setMemberNumber={setMemberNumber}
          loading={loading}
          error={error}
        />

        <PasswordInput
          password={password}
          setPassword={setPassword}
          loading={loading}
          error={error}
        />

        <div className="space-y-4">
          <LoginButton loading={loading} />
          <ForgotPasswordButton />
        </div>
        
        <div className="flex justify-end">
          <LegalLinks />
        </div>
      </form>
    </div>
  );
};

export default LoginForm;