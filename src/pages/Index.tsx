
import { useState, useEffect } from "react";
import { LoginForm } from "@/components/login/LoginForm";
import { Features } from "@/components/login/Features";
import { Announcements } from "@/components/login/Announcements";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export const Index = () => {
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const currentYear = new Date().getFullYear();

  if (!mounted) {
    return (
      <div className="min-h-screen p-3 sm:p-4 login-container">
        <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="h-[44px]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary focus:text-foreground"
      >
        Skip to main content
      </a>

      <div className="min-h-screen p-3 sm:p-4 login-container">
        <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <header className="flex justify-between items-center mb-4">
            <h1 className="sr-only">PWA Burton Member Portal</h1>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] bg-gray-800 dark:bg-gray-700 text-white hover:bg-primary hover:text-primary-foreground ml-auto"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </header>

          <main id="main-content" className="grid lg:grid-cols-2 gap-4 sm:gap-8">
            <div className="glass-card p-4 sm:p-8 space-y-6 sm:space-y-8">
              <div className="text-left">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                  <span className="text-primary">Member Portal</span>
                </h2>
                <p className="text-subtle text-base sm:text-lg">
                  Access your membership information, stay updated with announcements, and manage your payments all in one place.
                </p>
              </div>

              <Features />
            </div>

            <div className="glass-card p-4 sm:p-8 flex flex-col justify-center">
              <div className="text-center mb-6 sm:mb-8">
                <p 
                  className="text-2xl mb-3 sm:mb-4 font-arabic text-primary"
                  lang="ar"
                  dir="rtl"
                >
                  بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                  Pakistan Welfare Association
                </h2>
                <p className="text-subtle text-sm sm:text-base">
                  Welcome to our community platform. Please login with your member number.
                </p>
              </div>

              <LoginForm onLoginSuccess={handleLoginSuccess} />

              {lastLogin && (
                <p className="text-muted text-xs sm:text-sm mt-4">
                  Last login: {new Date(lastLogin).toLocaleString()}
                </p>
              )}

              <div className="text-center space-y-3 sm:space-y-4 mt-6">
                <p className="text-subtle text-xs max-w-md mx-auto">
                  By logging in, you agree to the PWA Collector Member Responsibilities and Pakistan Welfare Association Membership Terms
                </p>
              </div>
            </div>
          </main>

          <Announcements />

          <footer className="text-center pt-6 sm:pt-8 space-y-2">
            <p className="text-subtle text-xs sm:text-sm">
              © {currentYear} SmartFIX Tech, Burton Upon Trent. All rights reserved.
            </p>
            <p className="text-subtle text-xs sm:text-sm">
              Website created and coded by <span className="text-primary">Zaheer Asghar</span>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Index;
