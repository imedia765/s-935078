import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { LoginState } from './types/loginTypes';

export const useLoginForm = () => {
  const [state, setState] = useState<LoginState>({
    memberNumber: '',
    password: '',
    loading: false,
    error: null
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setMemberNumber = (value: string) => setState(prev => ({ ...prev, memberNumber: value }));
  const setPassword = (value: string) => setState(prev => ({ ...prev, password: value }));
  const setLoading = (value: boolean) => setState(prev => ({ ...prev, loading: value }));
  const setError = (value: string | null) => setState(prev => ({ ...prev, error: value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.loading || !state.memberNumber.trim() || !state.password.trim()) return;
    
    setError(null);
    setLoading(true);

    try {
      const isMobile = window.innerWidth <= 768;
      console.log('[Login] Starting login process', { 
        deviceType: isMobile ? 'mobile' : 'desktop',
        identifier: state.memberNumber,
        timestamp: new Date().toISOString()
      });

      // Validate member number format
      if (!state.memberNumber.match(/^[A-Z]{2}\d{5}$/)) {
        setError('Invalid member number format. Please use the format XX00000 (e.g., TM10003)');
        setLoading(false);
        return;
      }

      // Construct legacy email
      const loginEmail = `${state.memberNumber.toLowerCase()}@temp.com`;
      console.log('[Login] Using legacy email:', loginEmail);

      // Attempt login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: state.password
      });

      if (signInError) {
        console.error('[Login] Sign in error:', signInError);
        setError('Invalid member number or password');
        return;
      }

      // Success path
      console.log('[Login] Login successful');
      await queryClient.invalidateQueries();
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      if (isMobile) {
        window.location.href = '/';
      } else {
        navigate('/', { replace: true });
      }

    } catch (error: any) {
      console.error('[Login] Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
      });
      
      setError(error.message || 'An unexpected error occurred');
      
      toast({
        title: "Login failed",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    memberNumber: state.memberNumber,
    password: state.password,
    loading: state.loading,
    error: state.error,
    setMemberNumber,
    setPassword,
    handleLogin
  };
};