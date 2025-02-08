
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

        default:
          if (!session) {
            console.log("[Session] Session ended");
            navigate("/");
            toast({
              title: "Session Ended",
              description: "Your session has ended. Please sign in again to continue.",
              variant: "destructive",
            });
          }
      }
    });

    // Attempt to refresh the session on mount
    const refreshSession = async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        console.log("[Session] Initial refresh successful:", data.session?.expires_at);
      } catch (error) {
        console.error("[Session] Refresh error:", error);
        if (window.location.pathname !== "/") {
          navigate("/");
          toast({
            title: "Session Error",
            description: "Please sign in again to continue.",
            variant: "destructive",
          });
        }
      } finally {
        setSessionChecked(true);
      }
    };

    refreshSession();
    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  return { sessionChecked, setSessionChecked, sessionExpiring };
}
