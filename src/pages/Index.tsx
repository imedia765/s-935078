
import { useState, useEffect } from "react";
import { LoginForm } from "@/components/login/LoginForm";
import { Features } from "@/components/login/Features";
import { Announcements } from "@/components/login/Announcements";

export const Index = () => {
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  useEffect(() => {
    const lastLoginTime = localStorage.getItem("lastLoginTime");
    if (lastLoginTime) {
      setLastLogin(lastLoginTime);
    }
  }, []);

  const handleLoginSuccess = () => {
    const currentTime = new Date().toISOString();
    localStorage.setItem("lastLoginTime", currentTime);
    setLastLogin(currentTime);
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 login-container">
      <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="glass-card p-4 sm:p-8 space-y-6 sm:space-y-8">
            <div className="text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient mb-3 sm:mb-4">
                Member Portal
              </h1>
              <p className="text-base sm:text-lg text-gray-400">
                Access your membership information, stay updated with announcements, and manage your payments all in one place.
              </p>
            </div>

            <Features />
          </div>

          <div className="glass-card p-4 sm:p-8 flex flex-col justify-center">
            <div className="text-center mb-6 sm:mb-8">
              <p className="text-lg mb-3 sm:mb-4 font-arabic">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Pakistan Welfare Association</h2>
              <p className="text-sm sm:text-base text-gray-400">
                Welcome to our community platform. Please login with your member number.
              </p>
            </div>

            <LoginForm onLoginSuccess={handleLoginSuccess} />

            {lastLogin && (
              <p className="text-xs sm:text-sm text-gray-400 mt-4">
                Last login: {new Date(lastLogin).toLocaleString()}
              </p>
            )}

            <div className="text-center space-y-3 sm:space-y-4 mt-6">
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                By logging in, you agree to the PWA Collector Member Responsibilities and Pakistan Welfare Association Membership Terms
              </p>
            </div>
          </div>
        </div>

        <Announcements />

        <div className="text-center text-xs sm:text-sm text-gray-400 pt-6 sm:pt-8">
          <p>© 2024 SmartFIX Tech, Burton Upon Trent. All rights reserved.</p>
          <p className="mt-2">Website created and coded by Zaheer Asghar</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
