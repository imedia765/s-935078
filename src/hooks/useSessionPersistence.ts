
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSessionPersistence() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionExpiring, setSessionExpiring] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check session expiry every minute
    const sessionCheckInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const expiresAt = new Date(session.expires_at! * 1000);
        const timeUntilExpiry = expiresAt.getTime() - new Date().getTime();
        
        // If session expires in less than 5 minutes
        if (timeUntilExpiry < 300000 && !sessionExpiring) {
          setSessionExpiring(true);
          toast({
            title: "Session Expiring Soon",
            description: "Your session will expire in 5 minutes. Please save your work.",
            duration: 10000,
          });
        }
      }
    }, 60000);

    return () => clearInterval(sessionCheckInterval);
  }, [sessionExpiring, toast]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Session Event]:", event, "Session:", session?.expires_at);
      
      if (!session && event !== 'INITIAL_SESSION') {
        console.log("[Session] No session found, redirecting to login");
        navigate("/");
        toast({
          title: "Session Ended",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        return;
      }

      switch (event) {
        case 'SIGNED_OUT':
          console.log("[Session] User signed out");
          navigate("/");
          toast({
            title: "Session Ended",
            description: "Please sign in again to continue.",
            variant: "destructive",
          });
          break;

        case 'TOKEN_REFRESHED':
          console.log("[Session] Token refreshed successfully");
          setSessionExpiring(false);
          toast({
            title: "Session Extended",
            description: "Your session has been renewed.",
          });
          break;

        case 'USER_UPDATED':
          console.log("[Session] User data updated");
          toast({
            title: "Profile Updated",
            description: "Your profile information has been updated.",
          });
          break;

        case 'SIGNED_IN':
          console.log("[Session] User signed in");
          toast({
            title: "Welcome Back",
            description: "You have successfully signed in.",
          });
          break;

        case 'INITIAL_SESSION':
          console.log("[Session] Initial session loaded");
          break;

        case 'PASSWORD_RECOVERY':
          console.log("[Session] Password recovery initiated");
          break;
      }
    });

    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[Session] Initial session check:", session);
        
        if (!session) {
          console.log("[Session] No session found on initial check");
          if (window.location.pathname !== "/") {
            navigate("/");
          }
        } else {
          // Only attempt refresh if we have a session
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error("[Session] Refresh error:", error);
            if (error.message.includes("refresh_token_not_found")) {
              navigate("/");
              toast({
                title: "Session Expired",
                description: "Please sign in again to continue.",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error("[Session] Check error:", error);
      } finally {
        setSessionChecked(true);
      }
    };

    checkSession();
    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  return { sessionChecked, setSessionChecked, sessionExpiring };
}
