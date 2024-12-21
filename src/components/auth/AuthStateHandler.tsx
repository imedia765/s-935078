import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AuthStateHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (location.pathname !== '/login' && location.pathname !== '/register') {
          navigate('/login');
        }
        return;
      }

      // Check if user is first time login
      const { data: memberData, error } = await supabase
        .from('members')
        .select('first_time_login, profile_completed')
        .eq('email', session.user.email)
        .maybeSingle();

      if (error) {
        console.error("Error checking member status:", error);
        return;
      }

      // If first time login or profile not completed, redirect to profile
      if (memberData?.first_time_login || !memberData?.profile_completed) {
        if (location.pathname !== '/admin/profile') {
          toast({
            title: "Welcome!",
            description: "Please complete your profile information.",
          });
          navigate('/admin/profile');
        }
      }
    };

    checkAuthAndRedirect();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (event === 'SIGNED_IN') {
        checkAuthAndRedirect();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, toast]);

  return null;
};