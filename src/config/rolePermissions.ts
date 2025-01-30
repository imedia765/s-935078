import { UserAccess } from '@/types/user-access';

type PermissionMapping = Partial<UserAccess['permissions']>;

export const enhancedRolePermissionsMap: Record<string, PermissionMapping> = {
  'system_admin': {
    system: {
      accessSystem: true,
      manageSystemSettings: true,
      viewSystemLogs: true,
      performSystemMaintenance: true
    }
  },
  'financial_admin': {
    payments: {
      collectPayments: true,
      viewPaymentReports: true,
      managePaymentMethods: true,
      refundPayments: true,
      exportFinancialData: true
    }
  },
  'user_manager': {
    users: {
      manageBasicUsers: true,
      manageAdminUsers: false,
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
      manageBasicUsers: false,
      manageAdminUsers: false,
      viewUsers: true
    },
    collectors: {
      manageCollectors: false,
      assignCollectors: false,
      viewCollectorPerformance: true
    },
    payments: {
      collectPayments: true,
      viewPaymentReports: true,
      managePaymentMethods: false
    },
    system: {
      accessSystem: true,
      manageSystemSettings: false
    },
    dashboard: {
      viewDashboard: true,
      viewPerformanceMetrics: true
    }
  },
  'member': {
    users: {
      manageBasicUsers: false,
      manageAdminUsers: false,
      viewUsers: false
    },
    collectors: {
      manageCollectors: false,
      assignCollectors: false
    },
    payments: {
      collectPayments: false,
      viewPaymentReports: false,
      managePaymentMethods: false
    },
    system: {
      accessSystem: true,
      manageSystemSettings: false
    },
    audit: {
      viewAuditLogs: false
    },
    dashboard: {
      viewDashboard: true
    }
  }
};