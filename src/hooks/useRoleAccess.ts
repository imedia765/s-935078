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

      // First check if user is an admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error checking user_roles:', roleError);
        toast({
          title: "Error fetching role",
          description: roleError.message,
          variant: "destructive",
        });
        throw roleError;
      }

      // If user is an admin, return admin role immediately
      if (roleData?.role === 'admin') {
        console.log('User is an admin');
        return 'admin' as UserRole;
      }

      // Then check if user is a collector in members_collectors
      const { data: collectorData, error: collectorError } = await supabase
        .from('members_collectors')
        .select('name')
        .eq('member_profile_id', session.user.id)
        .eq('active', true)
        .maybeSingle();

      if (collectorError && collectorError.code !== 'PGRST116') {
        console.error('Error checking collector status:', collectorError);
      }

      // If user is a collector, return collector role
      if (collectorData?.name) {
        console.log('User is a collector:', collectorData.name);
        return 'collector' as UserRole;
      }

      // Finally check if user is a regular member
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error checking member status:', memberError);
      }

      if (memberData?.id) {
        console.log('User is a regular member');
        return 'member' as UserRole;
      }

      console.log('No specific role found, defaulting to member');
      return 'member' as UserRole;
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