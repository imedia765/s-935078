
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

      <div className="min-h-screen p-4 sm:p-6 md:p-8 login-container">
        <div className="w-full max-w-7xl mx-auto space-y-8 sm:space-y-10">
          <header className="flex justify-between items-center mb-6">
            <h1 className="sr-only">PWA Burton Member Portal</h1>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] bg-gray-800 dark:bg-gray-700 text-white hover:bg-primary hover:text-primary-foreground ml-auto"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </header>

          <main id="main-content" className="grid lg:grid-cols-2 gap-6 sm:gap-10">
            <div className="glass-card p-6 sm:p-8 md:p-10 space-y-8">
              <div className="text-left">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
                  <span className="text-primary">Member Portal</span>
                </h2>
                <p className="text-subtle text-lg sm:text-xl leading-relaxed">
                  Access your membership information, stay updated with announcements, and manage your payments all in one place.
                </p>
              </div>

              <Features />
            </div>

            <div className="glass-card p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <div className="text-center mb-8 sm:mb-10">
                <p 
                  className="text-3xl sm:text-4xl mb-6 font-arabic text-primary leading-relaxed"
                  lang="ar"
                  dir="rtl"
                >
                  بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">
                  Pakistan Welfare Association
                </h2>
                <p className="text-subtle text-lg sm:text-xl">
                  Welcome to our community platform. Please login with your member number.
                </p>
              </div>

              <LoginForm onLoginSuccess={handleLoginSuccess} />

              {lastLogin && (
                <p className="text-muted text-sm sm:text-base mt-6">
                  Last login: {new Date(lastLogin).toLocaleString()}
                </p>
              )}

              <div className="text-center space-y-4 mt-8">
                <p className="text-subtle text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                  By logging in, you agree to the PWA Collector Member Responsibilities and Pakistan Welfare Association Membership Terms
                </p>
              </div>
            </div>
          </main>

          <Announcements />

          <footer className="text-center pt-8 sm:pt-10 space-y-3">
            <p className="text-subtle text-sm sm:text-base">
              © {currentYear} SmartFIX Tech, Burton Upon Trent. All rights reserved.
            </p>
            <p className="text-subtle text-sm sm:text-base">
              Website created and coded by <span className="text-primary">Zaheer Asghar</span>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Index;
