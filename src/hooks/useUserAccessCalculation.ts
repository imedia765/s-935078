import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { UserAccess, DEFAULT_USER_ACCESS, isValidRole } from '@/types/user-access';
import { useToast } from "@/hooks/use-toast";

interface RoleData {
  role: string;
  created_at: string;
}

interface EnhancedRoleData {
  role_name: string;
  is_active: boolean;
}

export const useUserAccessCalculation = (userId: string | null) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['user-access', userId],
    queryFn: async (): Promise<UserAccess> => {
      if (!userId) {
        console.log('[UserAccess] No user ID provided, returning default access');
        return DEFAULT_USER_ACCESS;
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

        console.log('[UserAccess] Fetched roles:', {
          basicRoles: basicRoles.data,
          enhancedRoles: enhancedRoles.data
        });

        // Start with default access
        const userAccess: UserAccess = { ...DEFAULT_USER_ACCESS };

        // Process basic roles
        const roles = (basicRoles.data || []) as RoleData[];
        const activeEnhancedRoles = (enhancedRoles.data || []) as EnhancedRoleData[];

        // Set base role (prioritize admin > collector > member)
        if (roles.some(r => r.role === 'admin')) {
          userAccess.baseRole = 'admin';
        } else if (roles.some(r => r.role === 'collector')) {
          userAccess.baseRole = 'collector';
        }

        // Apply permissions based on base role
        if (userAccess.baseRole === 'admin') {
          // Admin gets full access
          userAccess.permissions = {
            users: {
              manageBasicUsers: true,
              manageAdminUsers: true,
              viewUsers: true,
              impersonateUsers: true
            },
            collectors: {
              manageCollectors: true,
              assignCollectors: true,
              viewCollectorPerformance: true
            },
            payments: {
              collectPayments: true,
              viewPaymentReports: true,
              managePaymentMethods: true,
              refundPayments: true,
              exportFinancialData: true
            },
            system: {
              accessSystem: true,
              manageSystemSettings: true,
              viewSystemLogs: true,
              performSystemMaintenance: true
            },
            audit: {
              viewAuditLogs: true,
              exportAuditLogs: true
            },
            dashboard: {
              viewDashboard: true,
              viewPerformanceMetrics: true,
              viewFinancialSummary: true
            }
          };
        } else if (userAccess.baseRole === 'collector') {
          // Collector gets specific permissions
          userAccess.permissions = {
            ...userAccess.permissions,
            users: {
              ...userAccess.permissions.users,
              viewUsers: true
            },
            collectors: {
              ...userAccess.permissions.collectors,
              viewCollectorPerformance: true
            },
            payments: {
              ...userAccess.permissions.payments,
              collectPayments: true,
              viewPaymentReports: true
            },
            dashboard: {
              ...userAccess.permissions.dashboard,
              viewPerformanceMetrics: true
            }
          };
        }

        // Apply enhanced role permissions
        activeEnhancedRoles.forEach(enhancedRole => {
          switch (enhancedRole.role_name) {
            case 'system_admin':
              userAccess.permissions.system.manageSystemSettings = true;
              userAccess.permissions.system.viewSystemLogs = true;
              break;
            case 'financial_admin':
              userAccess.permissions.payments.managePaymentMethods = true;
              userAccess.permissions.payments.refundPayments = true;
              userAccess.permissions.payments.exportFinancialData = true;
              break;
            case 'user_manager':
              userAccess.permissions.users.manageBasicUsers = true;
              userAccess.permissions.users.viewUsers = true;
              break;
            case 'audit_viewer':
              userAccess.permissions.audit.viewAuditLogs = true;
              break;
            // Add more enhanced role mappings as needed
          }
        });

        console.log('[UserAccess] Calculated access:', userAccess);
        return userAccess;

      } catch (error) {
        console.error('[UserAccess] Error calculating user access:', error);
        toast({
          title: "Error calculating user access",
          description: "There was a problem determining user permissions",
          variant: "destructive",
        });
        return DEFAULT_USER_ACCESS;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
};