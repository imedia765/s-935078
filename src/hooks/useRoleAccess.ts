import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserRole = 'member' | 'collector' | 'admin' | null;

const ROLE_STALE_TIME = 1000 * 60 * 5; // 5 minutes

export const useRoleAccess = () => {
  const { toast } = useToast();

  const { data: userRole, isLoading: roleLoading, error } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      console.log('Fetching user role from central hook...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('No session found in central role check');
        return null;
      }

      console.log('Session user in central role check:', session.user.id);

      // Check user_roles table directly
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role in central hook:', roleError);
        toast({
          title: "Error fetching role",
          description: roleError.message,
          variant: "destructive",
        });
        throw roleError;
      }

      // If no role is found, default to 'member'
      console.log('Fetched role from central hook:', roleData?.role);
      return (roleData?.role as UserRole) || 'member';
    },
    staleTime: ROLE_STALE_TIME,
    retry: 2,
    meta: {
      errorMessage: "Failed to fetch user role"
    }
  });

  const canAccessTab = (tab: string): boolean => {
    console.log('Checking access for tab:', tab, 'User role:', userRole);
    
    if (!userRole) return false;

    switch (userRole) {
      case 'admin':
        return true;
      case 'collector':
        return ['dashboard', 'users'].includes(tab);
      case 'member':
        return tab === 'dashboard';
      default:
        return false;
    }
  };

  return {
    userRole,
    roleLoading,
    error,
    canAccessTab,
  };
};