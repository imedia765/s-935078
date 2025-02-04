import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Bell, CreditCard, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

export const Index = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First check if member exists and is active
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("member_number", memberNumber)
        .single();

      if (memberError || !member) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Member number not found",
        });
        return;
      }

      if (member.status !== "active") {
        toast({
          variant: "destructive",
          title: "Account Inactive",
          description: "Please contact support to activate your account",
        });
        return;
      }

      // Attempt to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${memberNumber.toLowerCase()}@temp.com`,
        password,
      });

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
          description: signInError.message,
        });
        return;
      }

      // Success - redirect to profile
      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });
      navigate("/profile");

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
      console.error("Login error:", error);
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
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gradient mb-4">Member Portal</h1>
              <p className="text-lg text-gray-400">
                Access your membership information, stay updated with announcements, and manage your payments all in one place.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Secure Access</h3>
                  <p className="text-sm text-gray-400">Your data is protected with industry-standard encryption</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Bell className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Instant Updates</h3>
                  <p className="text-sm text-gray-400">Stay informed with real-time notifications</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CreditCard className="w-6 h-6 text-primary mt-1" />
                <div>
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
                <label htmlFor="memberNumber" className="block text-sm">
                  Member Number
                </label>
                <Input
                  id="memberNumber"
                  type="text"
                  placeholder="Enter your member number"
                  value={memberNumber}
                  onChange={(e) => setMemberNumber(e.target.value)}
                  className="bg-black/40"
                  disabled={isLoading}
                />
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/40"
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="text-center space-y-4">
                <p className="text-sm">
                  Need Help?{" "}
                  <a href="#" className="text-primary hover:underline">
                    Contact Support
                  </a>
                </p>
                <p className="text-xs text-gray-500">
                  By logging in, you agree to the PWA Collector Member Responsibilities and Pakistan Welfare Association Membership Terms
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Announcements Section */}
        <div className="glass-card p-8">
          <h2 className="text-3xl font-bold text-gradient mb-6">Latest Announcements</h2>
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="text-primary" />
                <div>
                  <h3 className="text-xl font-semibold text-gradient">New Committee as of December 2023</h3>
                  <p className="text-sm text-gray-400">Posted on December 1, 2023</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-200">
                <p>Brother Sajid has resigned and a new Committee was formally created. We would like to thank brother Sajid for his previous efforts, and he will continue helping the Committee where possible in an informal capacity.</p>
                <div className="pl-4">
                  <p><strong>Chairperson:</strong> Anjum Riaz & Habib Mushtaq</p>
                  <p><strong>Secretary:</strong> Tariq Majid</p>
                  <p><strong>Treasurer:</strong> Faizan Qadiri</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="text-primary" />
                <div>
                  <h3 className="text-xl font-semibold text-gradient">Important Member Information</h3>
                  <p className="text-sm text-gray-400">Posted on December 1, 2023</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-200">
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

        {/* Documents Section */}
        <div className="glass-card p-8">
          <h2 className="text-3xl font-bold text-gradient mb-6">Important Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-primary" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gradient">Member Guidelines</h3>
                  <p className="text-sm text-gray-400">Last updated: December 2023</p>
                </div>
                <Button variant="outline" className="bg-black/40 hover:bg-primary/20">
                  <FileText className="mr-2 h-4 w-4" /> View
                </Button>
              </div>
              <p className="text-gray-200">
                Complete guide to membership rules, rights, and responsibilities.
              </p>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-primary" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gradient">Payment Guidelines</h3>
                  <p className="text-sm text-gray-400">Last updated: December 2023</p>
                </div>
                <Button variant="outline" className="bg-black/40 hover:bg-primary/20">
                  <FileText className="mr-2 h-4 w-4" /> View
                </Button>
              </div>
              <p className="text-gray-200">
                Information about payment methods, deadlines, and policies.
              </p>
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