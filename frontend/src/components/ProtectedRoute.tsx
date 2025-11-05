import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, Role } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
  requiredRoles?: Role[];
  requiredPermission?: string;
  adminOnly?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  adminOnly = false,
  fallback
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, hasRole, hasAnyRole, hasPermission, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only check
  if (adminOnly && !isAdmin()) {
    return fallback || (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">관리자 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  // Single role check
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">필요한 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  // Multiple roles check
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return fallback || (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">필요한 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  // Permission-based check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">필요한 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}