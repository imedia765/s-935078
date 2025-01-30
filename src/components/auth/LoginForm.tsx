import { useLoginForm } from './login/useLoginForm';
import MemberNumberInput from './login/MemberNumberInput';
import PasswordInput from './login/PasswordInput';
import LoginButton from './login/LoginButton';
import LegalLinks from './login/LegalLinks';
import { ForgotPasswordButton } from './login/ForgotPasswordButton';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MessageSquare } from "lucide-react";
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const LoginForm = () => {
  const { memberNumber, password, setMemberNumber, setPassword, loading, handleLogin, error } = useLoginForm();
  const [supportName, setSupportName] = useState('');
  const [supportIssue, setSupportIssue] = useState('');

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent(
      `[PWA-SUPPORT]\nMember #: ${supportName ? supportName : 'Not provided'}\nName: ${supportName}\nIssue: ${supportIssue}`
    );
    window.open(`https://wa.me/447476816917?text=${message}`, '_blank');
  };

  return (
    <div className="bg-dashboard-card rounded-lg shadow-lg p-8 mb-12">
      {/* WhatsApp Support Form */}
      <div className="mb-6 bg-dashboard-softGreen border border-dashboard-accent3/20 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-start space-x-3">
          <MessageSquare className="h-5 w-5 text-dashboard-accent3 mt-1" />
          <div className="text-dashboard-dark flex-1">
            <p className="text-sm font-medium mb-3">
              Need assistance? Contact Support via WhatsApp
            </p>
            
            <div className="space-y-3 mb-4">
              <div>
                <Label htmlFor="supportName" className="text-xs text-dashboard-dark/80 mb-1">Your Name</Label>
                <Input
                  id="supportName"
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-white/80"
                />
              </div>
              
              <div>
                <Label htmlFor="supportIssue" className="text-xs text-dashboard-dark/80 mb-1">Describe Your Issue</Label>
                <Textarea
                  id="supportIssue"
                  value={supportIssue}
                  onChange={(e) => setSupportIssue(e.target.value)}
                  placeholder="Please describe your issue briefly"
                  className="bg-white/80 min-h-[80px]"
                />
              </div>
            </div>

            <p className="text-xs text-dashboard-dark/80 mb-3">
              Note: Our WhatsApp support is dedicated to app-related inquiries only. For all other matters, please reach out to your collector directly.
            </p>
            
            <button 
              onClick={handleWhatsAppSupport}
              className="inline-flex items-center text-dashboard-accent3 hover:text-dashboard-accent3/80 font-semibold transition-colors disabled:opacity-50"
              disabled={!supportName || !supportIssue}
            >
              Open WhatsApp Chat →
            </button>
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