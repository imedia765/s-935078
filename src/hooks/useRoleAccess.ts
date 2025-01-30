import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from './useAuthSession';
import { useRoleSync } from './useRoleSync';
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

export const useRoleAccess = () => {
  const { session } = useAuthSession();
  const { syncRoles } = useRoleSync();
  const [initialized, setInitialized] = useState(false);

  const { data: userRoles = [], isLoading, error } = useQuery({
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

      return data.map(r => r.role) as UserRole[];
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

  const hasRole = (role: UserRole) => {
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return roles.some(role => hasRole(role));
  };

  const canAccessTab = (tab: string): boolean => {
    const roleMap: Record<string, UserRole[]> = {
      dashboard: ['member', 'admin', 'collector'],
      users: ['admin', 'collector'],
      financials: ['admin'],
      system: ['admin']
    };

    const allowedRoles = roleMap[tab] || [];
    return hasAnyRole(allowedRoles);
  };

  // Get primary role (admin > collector > member)
  const userRole = userRoles.includes('admin') 
    ? 'admin' 
    : userRoles.includes('collector')
      ? 'collector'
      : userRoles.includes('member')
        ? 'member'
        : null;

  return {
    userRoles,
    userRole,
    hasRole,
    hasAnyRole,
    canAccessTab,
    isLoading,
    error
  };
};