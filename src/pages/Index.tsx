import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Bell, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { WhatsAppSupport } from "@/components/WhatsAppSupport";
import { validateField } from "@/types/member";

export const Index = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    memberNumber?: string;
    password?: string;
  }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Simplified password validation for login - no requirements
  const validatePassword = (pass: string) => {
    if (!pass.trim()) return "Password is required";
    return "";
  };

  // Member number validation
  const validateMemberNumber = (num: string) => {
    const regex = /^[A-Z]{2}\d{5}$/;
    if (!regex.test(num)) {
      return "Member number must be 2 letters followed by 5 numbers (e.g., AB12345)";
    }
    return "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset validation errors
    setValidationErrors({});

    // Validate inputs
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
      // First clear any existing sessions to prevent refresh token errors
      await supabase.auth.signOut();
      
      console.log("Attempting login for member:", memberNumber);
      
      // Check if member exists and is active
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("*, auth_user_id")
        .eq("member_number", memberNumber)
        .single();

      console.log("Member lookup result:", { member, memberError });

      if (memberError || !member) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Please check your member number and try again",
        });
        setIsLoading(false);
        return;
      }

      // Check if account is locked
      if (member.locked_until && new Date(member.locked_until) > new Date()) {
        const waitTime = Math.ceil(
          (new Date(member.locked_until).getTime() - new Date().getTime()) / 1000 / 60
        );
        toast({
          variant: "destructive",
          title: "Account Temporarily Locked",
          description: `Please try again in ${waitTime} minutes or contact support`,
        });
        setIsLoading(false);
        return;
      }

      // Get user roles if auth_user_id exists
      let userRoles = [];
      if (member.auth_user_id) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", member.auth_user_id);
        userRoles = roles || [];
      }

      console.log("User roles:", userRoles);

      if (member.status !== "active") {
        // Check for failed login attempts
        if (member.failed_login_attempts && member.failed_login_attempts > 3) {
          toast({
            variant: "destructive",
            title: "Account Locked",
            description: "Too many failed attempts. Please contact support.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Account Inactive",
            description: "Please contact support to activate your account",
          });
        }
        setIsLoading(false);
        return;
      }

      // Attempt to sign in
      const loginEmail = `${memberNumber.toLowerCase()}@temp.com`;
      console.log("Attempting auth with email:", loginEmail);
      
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      console.log("Auth result:", { authData, signInError });

      if (signInError) {
        // Handle failed login attempt
        const { error: loginError } = await supabase.rpc("handle_failed_login", {
          member_number: memberNumber,
        });

        if (loginError) {
          console.error("Error handling failed login:", loginError);
        }

        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      // Reset failed login attempts on successful login
      await supabase.rpc("reset_failed_login", {
        member_number: memberNumber,
      });

      // Verify session is established
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Failed to establish session");
      }

      // Success - redirect to profile
      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });
      navigate("/profile");

    } catch (error: any) {
      console.error("Login error:", error);
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
        {/* Login Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left side - Features */}
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

          {/* Right side - Login Form */}
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

        {/* Announcements Section */}
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

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-8">
          <p>© 2024 SmartFIX Tech, Burton Upon Trent. All rights reserved.</p>
          <p className="mt-2">Website created and coded by Zaheer Asghar</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
