import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

export interface UserAccess {
  baseRole: UserRole;
  permissions: {
    users: {
      manageBasicUsers: boolean;
      manageAdminUsers: boolean;
      viewUsers: boolean;
      impersonateUsers?: boolean;
    };
    collectors: {
      manageCollectors: boolean;
      assignCollectors: boolean;
      viewCollectorPerformance?: boolean;
    };
    payments: {
      collectPayments: boolean;
      viewPaymentReports: boolean;
      managePaymentMethods: boolean;
      refundPayments?: boolean;
      exportFinancialData?: boolean;
    };
    system: {
      accessSystem: boolean;
      manageSystemSettings: boolean;
      viewSystemLogs?: boolean;
      performSystemMaintenance?: boolean;
    };
    audit: {
      viewAuditLogs: boolean;
      exportAuditLogs?: boolean;
    };
    dashboard: {
      viewDashboard: boolean;
      viewPerformanceMetrics?: boolean;
      viewFinancialSummary?: boolean;
    };
  };
}

export interface UserAccessState {
  userAccess: UserAccess | null;
  isLoading: boolean;
  error: Error | null;
}

export const DEFAULT_USER_ACCESS: UserAccess = {
  baseRole: 'member',
  permissions: {
    users: {
      manageBasicUsers: false,
      manageAdminUsers: false,
      viewUsers: false,
    },
    collectors: {
      manageCollectors: false,
      assignCollectors: false,
    },
    payments: {
      collectPayments: false,
      viewPaymentReports: false,
      managePaymentMethods: false,
    },
    system: {
      accessSystem: true, // Basic system access is always true for authenticated users
      manageSystemSettings: false,
    },
    audit: {
      viewAuditLogs: false,
    },
    dashboard: {
      viewDashboard: true, // Basic dashboard access is always true for authenticated users
    },
  },
};

// Type guard to check if a role is valid
export const isValidRole = (role: string): role is UserRole => {
  return ['admin', 'collector', 'member'].includes(role);
};

// Helper function to check if a user has a specific permission
export const hasPermission = (
  userAccess: UserAccess | null,
  category: keyof UserAccess['permissions'],
  permission: string
): boolean => {
  if (!userAccess) return false;
  
  const categoryPermissions = userAccess.permissions[category];
  if (!categoryPermissions) return false;
  
  return (categoryPermissions as Record<string, boolean>)[permission] || false;
};

// Helper function to check if a user has any permission in a category
export const hasAnyPermissionInCategory = (
  userAccess: UserAccess | null,
  category: keyof UserAccess['permissions']
): boolean => {
  if (!userAccess) return false;
  
  const categoryPermissions = userAccess.permissions[category];
  if (!categoryPermissions) return false;
  
  return Object.values(categoryPermissions).some(value => value === true);
};

// Helper function to get all permissions for a category
export const getCategoryPermissions = (
  userAccess: UserAccess | null,
  category: keyof UserAccess['permissions']
): Record<string, boolean> => {
  if (!userAccess) return {};
  
  const categoryPermissions = userAccess.permissions[category];
  if (!categoryPermissions) return {};
  
  return categoryPermissions as Record<string, boolean>;
};