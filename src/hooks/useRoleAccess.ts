import { useEffect, useState, useCallback, useMemo } from 'react';
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
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10 // Keep in cache for 10 minutes (previously cacheTime)
  });

  // Memoize initialization effect to prevent unnecessary re-renders
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

  // Memoize role check functions
  const hasRole = useCallback((role: UserRole) => {
    return userRoles.includes(role);
  }, [userRoles]);

  const hasAnyRole = useCallback((roles: UserRole[]) => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  const canAccessTab = useCallback((tab: string): boolean => {
    const roleMap: Record<string, UserRole[]> = {
      dashboard: ['member', 'admin', 'collector'],
      users: ['admin', 'collector'],
      financials: ['admin'],
      system: ['admin']
    };

    const allowedRoles = roleMap[tab] || [];
    return hasAnyRole(allowedRoles);
  }, [hasAnyRole]);

  // Memoize primary role calculation
  const userRole = useMemo(() => 
    userRoles.includes('admin') 
      ? 'admin' 
      : userRoles.includes('collector')
        ? 'collector'
        : userRoles.includes('member')
          ? 'member'
          : null
  , [userRoles]);

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