import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { LoginState } from './types/loginTypes';
import { checkMaintenanceMode, validateAdminAccess } from './utils/maintenanceUtils';
import { attemptEmailLogin } from './utils/emailLoginUtils';
import { 
  validateMemberNumberFormat, 
  handleFailedLogin, 
  resetFailedAttempts,
  checkPasswordResetRequired 
} from './utils/memberLoginUtils';

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

      // Validate member number format if not an email
      try {
        validateMemberNumberFormat(state.memberNumber);
      } catch (error: any) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Try to sign in
      try {
        const signInData = await attemptEmailLogin(state.memberNumber, state.password);
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
        return;
      } catch (signInError: any) {
        console.error('[Login] Sign in error:', signInError);
        
        // Only handle failed login tracking for member numbers
        if (!state.memberNumber.includes('@')) {
          const failedLoginData = await handleFailedLogin(state.memberNumber);

          if (failedLoginData.locked) {
            setError(`Account locked due to too many failed attempts. Please try again after ${failedLoginData.lockout_duration}`);
            return;
          }

          setError(`Invalid credentials. ${failedLoginData.max_attempts - failedLoginData.attempts} attempts remaining.`);
        } else {
          setError('Invalid email or password.');
        }
        return;
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