import React from 'react';
import { useAuth, Role } from '../contexts/AuthContext';

interface RoleBasedComponentProps {
  children: React.ReactNode;
  requiredRole?: Role;
  requiredRoles?: Role[];
  requiredPermission?: string;
  adminOnly?: boolean;
  fallback?: React.ReactNode;
}

export function RoleBasedComponent({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  adminOnly = false,
  fallback = null
}: RoleBasedComponentProps) {
  const { user, isAuthenticated, hasRole, hasAnyRole, hasPermission, isAdmin } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Admin-only check
  if (adminOnly && !isAdmin()) {
    return <>{fallback}</>;
  }

  // Single role check
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // Multiple roles check
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  // Permission-based check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}