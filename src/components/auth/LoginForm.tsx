import { useLoginForm } from './login/useLoginForm';
import MemberNumberInput from './login/MemberNumberInput';
import PasswordInput from './login/PasswordInput';
import LoginButton from './login/LoginButton';
import LegalLinks from './login/LegalLinks';
import { ForgotPasswordButton } from './login/ForgotPasswordButton';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const LoginForm = () => {
  const { memberNumber, password, setMemberNumber, setPassword, loading, handleLogin, error } = useLoginForm();
  const [supportName, setSupportName] = useState('');
  const [supportIssue, setSupportIssue] = useState('');
  const [supportMemberNumber, setSupportMemberNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent(
      `[PWA-SUPPORT]\nMember #: ${supportMemberNumber ? supportMemberNumber : 'Not provided'}\nName: ${supportName}\nIssue: ${supportIssue}`
    );
    window.open(`https://wa.me/447476816917?text=${message}`, '_blank');
  };

  return (
    <div className="bg-dashboard-card rounded-lg shadow-lg p-8 mb-12">
      {/* WhatsApp Support Form */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-dashboard-softGreen hover:bg-dashboard-softGreen/90 border border-dashboard-accent3/20 rounded-lg text-dashboard-dark transition-colors">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-dashboard-accent3" />
            <span className="font-medium">Need assistance? Contact Support via WhatsApp</span>
          </div>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <div className="space-y-3 p-4 bg-dashboard-softGreen border border-dashboard-accent3/20 rounded-lg">
            <div>
              <Label htmlFor="supportMemberNumber" className="text-xs text-dashboard-dark/80 mb-1">Member Number (if known)</Label>
              <Input
                id="supportMemberNumber"
                value={supportMemberNumber}
                onChange={(e) => setSupportMemberNumber(e.target.value.toUpperCase())}
                placeholder="Enter your member number (e.g. TM12345)"
                className="bg-white/80"
              />
            </div>

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

            <p className="text-xs text-dashboard-dark/80 mb-3">
              Note: Our WhatsApp support is dedicated to app-related inquiries only. For all other matters, please reach out to your collector directly.
            </p>
            
            <button 
              onClick={handleWhatsAppSupport}
              className="inline-flex items-center px-4 py-2 rounded-md bg-dashboard-accent3 hover:bg-dashboard-accent3/80 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!supportName || !supportIssue}
            >
              Open WhatsApp Chat →
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
