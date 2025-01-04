import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import Index from './pages/Index';
import Login from './pages/Login';
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
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
      } else {
        // Refresh queries when logging in
        await queryClient.invalidateQueries();
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            session ? <Navigate to="/" replace /> : <Login />
          } 
        />
        <Route 
          path="/" 
          element={
            session ? <Index /> : <Navigate to="/login" replace />
          } 
        />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;