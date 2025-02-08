
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSessionPersistence() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Session Event]:", event);
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        navigate("/");
        toast({
          title: "Session Ended",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
      } else if (event === 'TOKEN_REFRESHED') {
        toast({
          title: "Session Refreshed",
          description: "Your session has been renewed.",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  return { sessionChecked, setSessionChecked };
}
