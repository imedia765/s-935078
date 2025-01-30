import { UserAccess } from '@/types/user-access';

type PermissionMapping = Partial<UserAccess['permissions']>;

export const enhancedRolePermissionsMap: Record<string, PermissionMapping> = {
  'system_admin': {
    system: {
      manageSystemSettings: true,
      viewSystemLogs: true,
      performSystemMaintenance: true
    }
  },
  'financial_admin': {
    payments: {
      managePaymentMethods: true,
      refundPayments: true,
      exportFinancialData: true
    }
  },
  'user_manager': {
    users: {
      manageBasicUsers: true,
      viewUsers: true
    }
  },
  'audit_viewer': {
    audit: {
      viewAuditLogs: true,
      exportAuditLogs: true
    }
  }
};

// Base role default permissions
export const baseRolePermissionsMap: Record<string, PermissionMapping> = {
  'admin': {
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
  },
  'collector': {
    users: {
      viewUsers: true
    },
    collectors: {
      viewCollectorPerformance: true
    },
    payments: {
      collectPayments: true,
      viewPaymentReports: true
    },
    system: {
      accessSystem: true
    },
    dashboard: {
      viewDashboard: true,
      viewPerformanceMetrics: true
    }
  },
  'member': {
    system: {
      accessSystem: true
    },
    dashboard: {
      viewDashboard: true
    }
  }
};