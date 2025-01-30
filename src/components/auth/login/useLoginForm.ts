import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthState, verifyMember, handleSignInError } from './utils/authUtils';

interface FailedLoginResponse {
  locked: boolean;
  attempts: number;
  max_attempts: number;
  lockout_duration: string;
}

export const useLoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !memberNumber.trim() || !password.trim()) return;
    
    setError(null);
    try {
      setLoading(true);
      const isMobile = window.innerWidth <= 768;
      console.log('[Login] Starting login process', { 
        deviceType: isMobile ? 'mobile' : 'desktop',
        identifier: memberNumber,
        timestamp: new Date().toISOString()
      });

      // Check maintenance mode first
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_settings')
        .select('is_enabled, message')
        .single();

      if (maintenanceError) {
        console.error('[Login] Error checking maintenance mode:', maintenanceError);
        throw new Error('Unable to verify system status');
      }

      if (maintenanceData?.is_enabled) {
        console.log('[Login] System in maintenance mode, checking admin credentials');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: memberNumber.includes('@') ? memberNumber : `${memberNumber}@temp.com`,
          password,
        });

        if (signInError) {
          console.log('[Login] Login failed during maintenance mode');
          throw new Error(maintenanceData.message || 'System is temporarily offline for maintenance');
        }

        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signInData.user.id);

        const isAdmin = roles?.some(r => r.role === 'admin');
        
        if (!isAdmin) {
          console.log('[Login] Non-admin access attempted during maintenance');
          throw new Error(maintenanceData.message || 'System is temporarily offline for maintenance');
        }

        console.log('[Login] Admin access granted during maintenance mode');
      }

      // If it's an email, try direct login first
      if (memberNumber.includes('@')) {
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: memberNumber,
            password: password.trim(),
          });

          if (!signInError) {
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
          }
        } catch (emailError) {
          console.log('[Login] Direct email login failed, continuing with member flow');
        }
      }

      // For member number flow, first check if it's a valid member number format
      if (!memberNumber.includes('@') && !/^[A-Z]{2}\d{5}$/.test(memberNumber)) {
        setError('Invalid member number format. Please use the format XX00000');
        return;
      }

      // Proceed with member number flow
      console.log('[Login] Starting member verification');
      try {
        const member = await verifyMember(memberNumber);
        
        if (!member.auth_user_id) {
          setError('Account not set up. Please contact support.');
          return;
        }

        // Get member's email
        const { data: memberData } = await supabase
          .from('members')
          .select('email')
          .eq('member_number', memberNumber)
          .maybeSingle();
          
        if (!memberData?.email) {
          setError('Email not set for this member. Please contact support.');
          return;
        }

        // Try to sign in with the member's email
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: memberData.email,
          password: password.trim(),
        });

        if (signInError) {
          console.error('[Login] Sign in error:', signInError);
          const { data: failedLoginData, error: failedLoginError } = await supabase
            .rpc('handle_failed_login', { member_number: memberNumber });

          if (failedLoginError) throw failedLoginError;

          const typedFailedLoginData = failedLoginData as FailedLoginResponse;
          if (typedFailedLoginData.locked) {
            setError(`Account locked due to too many failed attempts. Please try again after ${typedFailedLoginData.lockout_duration}`);
            return;
          }

          setError(`Invalid credentials. ${typedFailedLoginData.max_attempts - typedFailedLoginData.attempts} attempts remaining.`);
          return;
        }

        console.log('[Login] Sign in successful, resetting failed attempts');
        await supabase.rpc('reset_failed_login', { member_number: memberNumber });

        const { data: memberData2 } = await supabase
          .from('members')
          .select('password_reset_required')
          .eq('member_number', memberNumber)
          .maybeSingle();

        if (memberData2?.password_reset_required) {
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
        if (error.message === 'Member not found or inactive') {
          setError('Invalid member number or account inactive');
        } else {
          setError(error.message || 'An unexpected error occurred');
        }
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
    memberNumber,
    password,
    setMemberNumber,
    setPassword,
    loading,
    handleLogin,
    error
  };
};