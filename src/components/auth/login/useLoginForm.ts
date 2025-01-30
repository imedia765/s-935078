import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { LoginState } from './types/loginTypes';
import { checkMaintenanceMode, validateAdminAccess } from './utils/maintenanceUtils';
import { attemptEmailLogin, getMemberEmail } from './utils/emailLoginUtils';
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
    try {
      setLoading(true);
      const isMobile = window.innerWidth <= 768;
      console.log('[Login] Starting login process', { 
        deviceType: isMobile ? 'mobile' : 'desktop',
        identifier: state.memberNumber,
        timestamp: new Date().toISOString()
      });

      // Check maintenance mode
      const maintenanceData = await checkMaintenanceMode();
      if (maintenanceData?.is_enabled) {
        console.log('[Login] System in maintenance mode, checking admin credentials');
        const signInData = await attemptEmailLogin(
          state.memberNumber.includes('@') ? state.memberNumber : `${state.memberNumber}@temp.com`,
          state.password
        );

        const isAdmin = await validateAdminAccess(signInData);
        if (!isAdmin) {
          throw new Error(maintenanceData.message || 'System is temporarily offline for maintenance');
        }
        console.log('[Login] Admin access granted during maintenance mode');
      }

      // Try email login first if it's an email
      if (state.memberNumber.includes('@')) {
        try {
          const signInData = await attemptEmailLogin(state.memberNumber, state.password);
          console.log('[Login] Email login successful');
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
        } catch (emailError) {
          console.log('[Login] Direct email login failed, continuing with member flow');
        }
      }

      // Validate member number format
      validateMemberNumberFormat(state.memberNumber);

      // Get member's email
      const memberEmail = await getMemberEmail(state.memberNumber);

      // Try to sign in with the member's email
      try {
        await attemptEmailLogin(memberEmail, state.password);
      } catch (signInError: any) {
        console.error('[Login] Sign in error:', signInError);
        const failedLoginData = await handleFailedLogin(state.memberNumber);

        if (failedLoginData.locked) {
          setError(`Account locked due to too many failed attempts. Please try again after ${failedLoginData.lockout_duration}`);
          return;
        }

        setError(`Invalid credentials. ${failedLoginData.max_attempts - failedLoginData.attempts} attempts remaining.`);
        return;
      }

      console.log('[Login] Sign in successful, resetting failed attempts');
      await resetFailedAttempts(state.memberNumber);

      const passwordResetRequired = await checkPasswordResetRequired(state.memberNumber);
      if (passwordResetRequired) {
        console.log('[Login] Password reset required');
        toast({
          title: "Password reset required",
          description: "Please set a new password for your account",
        });
        return;
      }

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