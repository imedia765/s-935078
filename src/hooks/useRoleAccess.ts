import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from './useAuthSession';
import { useRoleSync } from './useRoleSync';

export const useRoleAccess = () => {
  const { session } = useAuthSession();
  const { syncRoles } = useRoleSync();
  const [initialized, setInitialized] = useState(false);

  const { data: userRoles = [], isLoading } = useQuery({
    queryKey: ['userRoles', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }

      return data.map(r => r.role);
    },
    enabled: !!session?.user?.id
  });

  useEffect(() => {
    const initializeRoles = async () => {
      if (session?.user?.id && !initialized) {
        try {
          await syncRoles(session.user.id);
          setInitialized(true);
        } catch (error) {
          console.error('Failed to initialize roles:', error);
        }
      }
    };

    initializeRoles();
  }, [session?.user?.id, syncRoles, initialized]);

  const hasRole = (role: string) => {
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => hasRole(role));
  };

  return {
    userRoles,
    hasRole,
    hasAnyRole,
    isLoading
  };
};