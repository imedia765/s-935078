import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import Index from './pages/Index';
import Login from './pages/Login';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

function AuthWrapper() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    let isSubscribed = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          navigate('/login');
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to login');
          navigate('/login');
          return;
        }

        // If we have a session, verify it's still valid
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Session invalid:', userError);
          await supabase.auth.signOut();
          navigate('/login');
          return;
        }

        console.log('Valid session found:', user.id);
        queryClient.invalidateQueries();
      } catch (error) {
        console.error('Session check failed:', error);
        navigate('/login');
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;
      
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.id);
        queryClient.invalidateQueries();
        navigate('/');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        queryClient.invalidateQueries();
        navigate('/login');
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
        queryClient.invalidateQueries();
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate, queryClient, toast]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthWrapper />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Index />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;