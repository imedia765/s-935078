import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import Index from './pages/Index';
import Login from './pages/Login';
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';

function AuthWrapper() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        console.log('No session found, redirecting to login');
        navigate('/login');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id);
      setSession(session);
      
      if (!session) {
        // Clear all queries when logging out
        await queryClient.resetQueries();
        navigate('/login');
      } else {
        // Refresh queries when logging in
        await queryClient.invalidateQueries();
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, queryClient]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthWrapper />
      <Routes>
        <Route 
          path="/login" 
          element={<Login />} 
        />
        <Route 
          path="/" 
          element={<Index />} 
        />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;