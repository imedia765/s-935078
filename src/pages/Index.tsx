
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Bell, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { WhatsAppSupport } from "@/components/WhatsAppSupport";
import { validateField } from "@/types/member";
import { Checkbox } from "@/components/ui/checkbox";

interface AuthSetupResponse {
  success: boolean;
  error?: string;
  auth_user_id?: string;
}

interface LoginAttemptResult {
  data: any;
  error: any;
  lockoutInfo?: {
    locked: boolean;
    attempts: number;
    locked_until?: string;
    next_lockout_duration?: number;
  };
}

export const Index = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    memberNumber?: string;
    password?: string;
  }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const tryLogin = async (email: string, attemptedFormat: string): Promise<LoginAttemptResult> => {
    try {
      console.log(`[Login] Attempting login with ${attemptedFormat}:`, email);
      
      // Check progressive lockout status first
      const { data: lockoutData, error: lockoutError } = await supabase.rpc('handle_progressive_lockout', {
        p_member_number: memberNumber
      });

      if (lockoutError) {
        console.error("[Login] Error checking lockout status:", lockoutError);
      } else if (lockoutData?.locked) {
        const lockedUntil = new Date(lockoutData.locked_until);
        const minutesLeft = Math.ceil((lockedUntil.getTime() - new Date().getTime()) / 1000 / 60);
        
        return {
          data: null,
          error: new Error(`Account is locked. Please try again in ${minutesLeft} minutes.`),
          lockoutInfo: lockoutData
        };
      }

      // Log the attempt
      await supabase.from('login_attempt_tracking').insert({
        member_number: memberNumber,
        attempted_email: email,
        status: 'attempting',
        error_details: { 
          format: attemptedFormat,
          ip_address: window.location.hostname // Basic IP tracking
        }
      });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error) {
        console.log(`[Login] Successful with ${attemptedFormat}`);
        // Log successful attempt
        await supabase.from('login_attempt_tracking').insert({
          member_number: memberNumber,
          attempted_email: email,
          status: 'success',
          error_details: { format: attemptedFormat }
        });

        // If this was a legacy format, try to standardize the email
        if (email.endsWith('@temp.com')) {
          const { data: standardizeData, error: standardizeError } = await supabase.rpc(
            'standardize_member_email',
            { p_member_number: memberNumber }
          );

          if (standardizeError) {
            console.error("[Login] Email standardization error:", standardizeError);
          } else {
            console.log("[Login] Email standardization result:", standardizeData);
          }
        }

        return { data, error: null, lockoutInfo: lockoutData };
      }
      
      console.log(`[Login] Failed with ${attemptedFormat}:`, error.message);
      // Log failed attempt
      await supabase.from('login_attempt_tracking').insert({
        member_number: memberNumber,
        attempted_email: email,
        status: 'failed',
        error_details: { 
          format: attemptedFormat,
          error: error.message
        }
      });

      return { data: null, error, lockoutInfo: lockoutData };
    } catch (error: any) {
      console.error(`[Login] Error during attempt with ${attemptedFormat}:`, error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    const rememberedMember = localStorage.getItem("rememberedMember");
    if (rememberedMember) {
      setMemberNumber(rememberedMember);
      setRememberMe(true);
    }
    const lastLoginTime = localStorage.getItem("lastLoginTime");
    if (lastLoginTime) {
      setLastLogin(lastLoginTime);
    }
  }, []);

  const getInputProps = (type: "memberNumber" | "password") => {
    const baseProps = {
      memberNumber: {
        name: "username",
        autoComplete: "username",
      },
      password: {
        name: "current-password",
        autoComplete: "current-password",
      },
    };
    return baseProps[type];
  };

  const validatePassword = (pass: string) => {
    if (!pass.trim()) return "Password is required";
    return "";
  };

  const validateMemberNumber = (num: string) => {
    const regex = /^[A-Z]{2}\d{5}$/;
    if (!regex.test(num)) {
      return "Member number must be 2 letters followed by 5 numbers (e.g., AB12345)";
    }
    return "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors({});

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
      await supabase.auth.signOut();
      
      // First ensure auth user exists
      const { data, error: rpcError } = await supabase.rpc('ensure_auth_setup', {
        p_member_number: memberNumber
      });

      const authSetup = (data as unknown) as AuthSetupResponse;

      if (rpcError || !authSetup?.success) {
        console.error("[Login] Auth setup error:", rpcError || authSetup?.error);
        toast({
          variant: "destructive",
          title: "Login Error",
          description: "Unable to setup authentication. Please contact support.",
        });
        setIsLoading(false);
        return;
      }

      // Get member details
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("*, auth_user_id, email")
        .eq("member_number", memberNumber)
        .maybeSingle();

      if (memberError || !member) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Member not found. Please check your member number.",
        });
        setIsLoading(false);
        return;
      }

      // Define email formats to try
      const emailFormats = [
        {
          email: `${memberNumber.toLowerCase()}@temp.pwaburton.org`,
          format: "Standard format",
          description: "Using your standardized member email"
        }
      ];

      // If member has a personal email, try that next
      if (member.email && !member.email.includes('@temp')) {
        emailFormats.push({
          email: member.email,
          format: "Personal email",
          description: "Using your personal email"
        });
      }

      // Add legacy format as last resort
      emailFormats.push({
        email: `${memberNumber.toLowerCase()}@temp.com`,
        format: "Legacy format",
        description: "Using legacy email format"
      });

      let loginSuccess = false;
      let lastError = null;
      let successfulEmail = '';
      let lastLockoutInfo = null;
      let attemptedFormats: string[] = [];

      // Try each format in sequence
      for (const { email, format, description } of emailFormats) {
        attemptedFormats.push(format);
        console.log(`[Login] Trying ${format}: ${description}`);
        
        const result = await tryLogin(email, format);
        
        // Update remaining attempts if available
        if (result.lockoutInfo) {
          lastLockoutInfo = result.lockoutInfo;
          const remainingAttempts = result.lockoutInfo.attempts;
          setRemainingAttempts(remainingAttempts);
        }

        if (result.error) {
          lastError = result.error;
          continue;
        }

        loginSuccess = true;
        successfulEmail = email;
        break;
      }

      if (!loginSuccess) {
        // Check if account is locked
        if (lastLockoutInfo?.locked) {
          const lockedUntil = new Date(lastLockoutInfo.locked_until!);
          const minutesLeft = Math.ceil((lockedUntil.getTime() - new Date().getTime()) / 1000 / 60);
          
          toast({
            variant: "destructive",
            title: "Account Locked",
            description: `Account is temporarily locked. Please try again in ${minutesLeft} minutes or contact support.`,
          });
        } else {
          const attemptsLeft = 5 - (lastLockoutInfo?.attempts || 0);
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: `Invalid credentials. ${attemptsLeft} attempts remaining before temporary lockout. Your member number is your password. Please contact support if you continue having issues.`,
          });
        }
        
        setIsLoading(false);
        return;
      }

      // Handle successful login
      if (rememberMe) {
        localStorage.setItem("rememberedMember", memberNumber);
      } else {
        localStorage.removeItem("rememberedMember");
      }

      const currentTime = new Date().toISOString();
      localStorage.setItem("lastLoginTime", currentTime);
      setLastLogin(currentTime);

      toast({
        title: "Welcome back!",
        description: `Successfully logged in using ${successfulEmail}`,
      });

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
    <div className="min-h-screen p-4 login-container">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-card p-8 space-y-8">
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-bold text-gradient mb-4">Member Portal</h1>
              <p className="text-lg text-gray-400">
                Access your membership information, stay updated with announcements, and manage your payments all in one place.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold mb-1">Secure Access</h3>
                  <p className="text-sm text-gray-400">Your data is protected with industry-standard encryption</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Bell className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold mb-1">Instant Updates</h3>
                  <p className="text-sm text-gray-400">Stay informed with real-time notifications</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CreditCard className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold mb-1">Easy Payments</h3>
                  <p className="text-sm text-gray-400">Manage your membership fees hassle-free</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 flex flex-col justify-center">
            <div className="text-center mb-8">
              <p className="text-lg mb-4 font-arabic">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
              <h2 className="text-2xl font-bold mb-2">Pakistan Welfare Association</h2>
              <p className="text-gray-400">
                Welcome to our community platform. Please login with your member number.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="memberNumber" className="block text-sm text-left">
                  Member Number
                </label>
                <Input
                  id="memberNumber"
                  type="text"
                  placeholder="Enter your member number (e.g., AB12345)"
                  value={memberNumber}
                  {...getInputProps("memberNumber")}
                  onChange={(e) => {
                    setMemberNumber(e.target.value.toUpperCase());
                    setValidationErrors((prev) => ({ ...prev, memberNumber: "" }));
                  }}
                  className={`bg-black/40 ${validationErrors.memberNumber ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {validationErrors.memberNumber && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.memberNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm">
                    Password
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-primary hover:underline px-0"
                    onClick={() => navigate("/reset-password")}
                  >
                    Forgot Password?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  {...getInputProps("password")}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  className={`bg-black/40 ${validationErrors.password ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {validationErrors.password && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>

              {lastLogin && (
                <p className="text-sm text-gray-400">
                  Last login: {new Date(lastLogin).toLocaleString()}
                </p>
              )}

              <div className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                
                <WhatsAppSupport />
              </div>

              <div className="text-center space-y-4">
                <p className="text-xs text-gray-500">
                  By logging in, you agree to the PWA Collector Member Responsibilities and Pakistan Welfare Association Membership Terms
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-3xl font-bold text-gradient mb-6 text-left">Latest Announcements</h2>
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <Bell className="text-primary flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gradient">New Committee as of December 2023</h3>
                  <p className="text-sm text-gray-400">Posted on December 1, 2023</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-200 text-left">
                <p>Brother Sajid has resigned and a new Committee was formally created. We would like to thank brother Sajid for his previous efforts, and he will continue helping the Committee where possible in an informal capacity.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Chairperson:</strong> Anjum Riaz & Habib Mushtaq</li>
                  <li><strong>Secretary:</strong> Tariq Majid</li>
                  <li><strong>Treasurer:</strong> Faizan Qadiri</li>
                </ul>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <Bell className="text-primary flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gradient">Important Member Information</h3>
                  <p className="text-sm text-gray-400">Posted on December 1, 2023</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-200 text-left">
                <p>All members have been given membership numbers. Please contact your collector to find this out.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Please login individually and fill in required data.</li>
                  <li>We expect timely payments that are up to date.</li>
                  <li>If payments are not up to date then you will not be covered.</li>
                  <li>Unfortunately we are not taking on new members at this time.</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 pt-8">
          <p>© 2024 SmartFIX Tech, Burton Upon Trent. All rights reserved.</p>
          <p className="mt-2">Website created and coded by Zaheer Asghar</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
