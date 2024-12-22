import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { DesktopNav } from "./navigation/DesktopNav";
import { MobileNav } from "./navigation/MobileNav";

export function NavigationMenu() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        if (!session) {
          console.log("No active session found");
          const { data: { session: refreshedSession }, error: refreshError } = 
            await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Session refresh error:", refreshError);
            setIsLoggedIn(false);
          } else {
            setIsLoggedIn(!!refreshedSession);
          }
        } else {
          console.log("Active session found");
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);
      
      if (event === "SIGNED_IN" && session) {
        setIsLoggedIn(true);
        try {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', session.user.id)
            .single();

          const userName = userProfile?.full_name || userProfile?.email || 'User';
          
          toast({
            title: "Signed in successfully",
            description: `Welcome back, ${userName}!`,
            duration: 3000,
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({
            title: "Signed in successfully",
            description: "Welcome back!",
            duration: 3000,
          });
        }
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        toast({
          title: "Logged out successfully",
          description: "Come back soon!",
          duration: 3000,
        });
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed successfully");
        setIsLoggedIn(true);
      } else if (event === "USER_UPDATED") {
        console.log("User data updated");
        setIsLoggedIn(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Only show loading state for initial load
  if (loading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              PWA Burton
            </span>
          </Link>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            PWA Burton
          </span>
        </Link>

        <DesktopNav isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
        
        <div className="flex items-center space-x-2 md:hidden">
          <ThemeToggle />
          <MobileNav 
            isLoggedIn={isLoggedIn} 
            handleLogout={handleLogout} 
            open={open} 
            setOpen={setOpen}
          />
        </div>
      </div>
    </nav>
  );
}