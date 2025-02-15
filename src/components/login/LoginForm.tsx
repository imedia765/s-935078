
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppSupport } from "@/components/WhatsAppSupport";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [memberNumber, setMemberNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    memberNumber?: string;
    password?: string;
  }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateMemberNumber = (num: string) => {
    const regex = /^[A-Z]{2}\d{5}$/;
    if (!regex.test(num)) {
      return "Member number must be 2 letters followed by 5 numbers (e.g., AB12345)";
    }
    return "";
  };

  const validatePassword = (pass: string) => {
    if (!pass.trim()) return "Password is required";
    return "";
  };

  const handleForgotPassword = () => {
    navigate("/reset-password");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const memberNumberError = validateMemberNumber(memberNumber);
    const passwordError = validatePassword(password);

    if (memberNumberError || passwordError) {
      setValidationErrors({
        memberNumber: memberNumberError,
        password: passwordError,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: `${memberNumber.toLowerCase()}@temp.pwaburton.org`,
        password,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials. Please try again or contact support.",
        });
        return;
      }

      if (rememberMe) {
        localStorage.setItem("rememberedMember", memberNumber);
      } else {
        localStorage.removeItem("rememberedMember");
      }

      const currentTime = new Date().toISOString();
      localStorage.setItem("lastLoginTime", currentTime);

      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });

      onLoginSuccess();
      navigate("/profile");

    } catch (error: any) {
      console.error("[Login] Unexpected error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6" noValidate aria-label="Login form">
      <div className="space-y-2">
        <label htmlFor="memberNumber" className="block text-sm text-left">
          Member Number <span aria-hidden="true">*</span>
        </label>
        <Input
          id="memberNumber"
          type="text"
          placeholder="Enter your member number (e.g., AB12345)"
          value={memberNumber}
          onChange={(e) => {
            setMemberNumber(e.target.value.toUpperCase());
            setValidationErrors((prev) => ({ ...prev, memberNumber: "" }));
          }}
          className={`bg-black/40 ${validationErrors.memberNumber ? 'border-red-500' : ''}`}
          disabled={isLoading}
          required
          aria-required="true"
          aria-invalid={!!validationErrors.memberNumber}
          aria-describedby={validationErrors.memberNumber ? "memberNumber-error" : undefined}
        />
        {validationErrors.memberNumber && (
          <p 
            id="memberNumber-error" 
            className="text-sm text-red-500 mt-1" 
            role="alert"
          >
            {validationErrors.memberNumber}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="block text-sm">
            Password <span aria-hidden="true">*</span>
          </label>
          <Button
            type="button"
            variant="link"
            className="text-sm text-primary hover:underline px-0"
            onClick={handleForgotPassword}
          >
            Forgot Password?
          </Button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setValidationErrors((prev) => ({ ...prev, password: "" }));
          }}
          className={`bg-black/40 ${validationErrors.password ? 'border-red-500' : ''}`}
          disabled={isLoading}
          required
          aria-required="true"
          aria-invalid={!!validationErrors.password}
          aria-describedby={validationErrors.password ? "password-error" : undefined}
        />
        {validationErrors.password && (
          <p 
            id="password-error" 
            className="text-sm text-red-500 mt-1" 
            role="alert"
          >
            {validationErrors.password}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          aria-label="Remember my member number"
        />
        <label
          htmlFor="rememberMe"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Remember me
        </label>
      </div>

      <div className="flex flex-col space-y-4">
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
        
        <WhatsAppSupport />
      </div>
    </form>
  );
};
