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
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center text-yellow-800">
          <MessageSquare className="h-5 w-5 mr-2" />
          <p className="text-sm">
            Having login issues? Contact us on WhatsApp:
            <br />
            <span className="font-medium">Zaheer - 07476 816917</span>
          </p>
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