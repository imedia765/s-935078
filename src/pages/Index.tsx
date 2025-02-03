import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Bell, CreditCard } from "lucide-react";

export const Index = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-container">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8">
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
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm">
                  Password
                </label>
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/40"
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Login
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
    </div>
  );
};

export default Index;