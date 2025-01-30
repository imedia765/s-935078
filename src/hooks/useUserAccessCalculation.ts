import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserAccess, DEFAULT_USER_ACCESS, isValidRole } from '@/types/user-access';
import { deepMerge } from '@/utils/objectUtils';
import { baseRolePermissionsMap, enhancedRolePermissionsMap } from '@/config/rolePermissions';

interface RoleData {
  role: string;
  created_at: string;
}

interface EnhancedRoleData {
  role_name: string;
  is_active: boolean;
}

const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[UserAccess] ${message}`, data);
  }
};

export const useUserAccessCalculation = (userId: string | null) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['user-access', userId],
    queryFn: async (): Promise<UserAccess> => {
      if (!userId) {
        logDebug('No user ID provided, returning default access');
        return { ...DEFAULT_USER_ACCESS };
      }

      try {
        // Fetch basic roles and enhanced roles in parallel
        const [basicRoles, enhancedRoles] = await Promise.all([
          supabase
            .from('user_roles')
            .select('role, created_at')
            .eq('user_id', userId),
          supabase
            .from('enhanced_roles')
            .select('role_name, is_active')
            .eq('user_id', userId)
            .eq('is_active', true)
        ]);

        if (basicRoles.error) throw basicRoles.error;
        if (enhancedRoles.error) throw enhancedRoles.error;

        logDebug('Fetched roles:', {
          basicRoles: basicRoles.data,
          enhancedRoles: enhancedRoles.data
        });

        // Start with default access
        let userAccess: UserAccess = { ...DEFAULT_USER_ACCESS };
        const roles = (basicRoles.data || []) as RoleData[];
        const activeEnhancedRoles = (enhancedRoles.data || []) as EnhancedRoleData[];

        // Set base role and its permissions (prioritize admin > collector > member)
        if (roles.some(r => isValidRole(r.role) && r.role === 'admin')) {
          userAccess.baseRole = 'admin';
          userAccess.permissions = { ...userAccess.permissions, ...baseRolePermissionsMap['admin'] };
        } else if (roles.some(r => isValidRole(r.role) && r.role === 'collector')) {
          userAccess.baseRole = 'collector';
          userAccess.permissions = { ...userAccess.permissions, ...baseRolePermissionsMap['collector'] };
        } else {
          userAccess.baseRole = 'member';
          userAccess.permissions = { ...userAccess.permissions, ...baseRolePermissionsMap['member'] };
        }

        // Apply enhanced role permissions
        activeEnhancedRoles.forEach(enhancedRole => {
          const additionalPermissions = enhancedRolePermissionsMap[enhancedRole.role_name];
          if (additionalPermissions) {
            userAccess.permissions = deepMerge(userAccess.permissions, additionalPermissions);
          }
        });

        logDebug('Calculated access:', userAccess);
        return userAccess;

      } catch (error) {
        console.error('[UserAccess] Error calculating user access:', error);
        toast({
          title: "Error calculating user access",
          description: "There was a problem determining user permissions",
          variant: "destructive",
        });
        return { ...DEFAULT_USER_ACCESS };
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
};