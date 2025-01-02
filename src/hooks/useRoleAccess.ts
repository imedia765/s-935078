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

      // First check members_roles table through RPC
      const { data: role, error: rpcError } = await supabase.rpc('get_user_role', {
        user_auth_id: session.user.id
      });

      if (rpcError) {
        console.error('Error fetching role in central hook:', rpcError);
        toast({
          title: "Error fetching role",
          description: rpcError.message,
          variant: "destructive",
        });
        throw rpcError;
      }

      console.log('Fetched role from central hook:', role);
      return role as UserRole;
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