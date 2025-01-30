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
      if (!session?.user?.id) {
        console.log('No user session found');
        return [];
      }

      console.log('Fetching roles for user:', session.user.id);

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }

      const roles = data.map(r => r.role) as UserRole[];
      console.log('Fetched roles:', roles);

      // Ensure member role is always present
      if (!roles.includes('member')) {
        roles.push('member');
      }

      return roles;
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
    console.log('Checking for role:', role, 'in userRoles:', userRoles);
    return userRoles.includes(role);
  }, [userRoles]);

  const hasAnyRole = useCallback((roles: UserRole[]) => {
    console.log('Checking for any roles:', roles, 'in userRoles:', userRoles);
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
    const hasAccess = hasAnyRole(allowedRoles);
    
    console.log('Tab access check:', {
      tab,
      allowedRoles,
      userRoles,
      hasAccess,
      timestamp: new Date().toISOString()
    });

    return hasAccess;
  }, [hasAnyRole, userRoles]);

  // Memoize primary role calculation with admin priority
  const userRole = useMemo(() => {
    console.log('Calculating primary role from:', userRoles);
    if (userRoles.includes('admin')) return 'admin';
    if (userRoles.includes('collector')) return 'collector';
    return 'member';
  }, [userRoles]);

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