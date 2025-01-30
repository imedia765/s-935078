import { ReactNode, useMemo } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

interface RoleBasedRendererProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAllRoles?: boolean;
  fallback?: ReactNode;
}

const RoleBasedRenderer = ({
  children,
  allowedRoles = [],
  requireAllRoles = false,
  fallback = null
}: RoleBasedRendererProps) => {
  const { hasRole, hasAnyRole, userRoles } = useRoleAccess();

  // Memoize access check to prevent unnecessary re-renders
  const hasAccess = useMemo(() => {
    if (!allowedRoles.length) {
      console.log('[RoleRenderer] No roles required, rendering children');
      return true;
    }

    // Check if user has both member and admin roles
    const isMemberAndAdmin = hasRole('member') && hasRole('admin');
    console.log('[RoleRenderer] Member and Admin check:', isMemberAndAdmin);

    // If requireAllRoles is true, check that user has all specified roles
    const access = requireAllRoles
      ? allowedRoles.every(role => hasRole(role))
      : hasAnyRole(allowedRoles);

    console.log('[RoleRenderer] Access check:', {
      allowedRoles,
      requireAllRoles,
      hasAccess: access,
      userRoles,
      isMemberAndAdmin,
      timestamp: new Date().toISOString()
    });

    return access;
  }, [allowedRoles, requireAllRoles, hasRole, hasAnyRole, userRoles]);

  return <>{hasAccess ? children : fallback}</>;
};

export default RoleBasedRenderer;