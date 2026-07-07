import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/primitives/shell';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional module path for module-based access control */
  modulePath?: string;
}

/**
 * ProtectedRoute - Centralized route protection component
 *
 * Handles two types of protection:
 * 1. Authentication: Redirects unauthenticated users to /login
 * 2. Module Access: Redirects unauthorized users to /dashboard (if modulePath specified)
 *
 * Usage:
 * - Auth only: <ProtectedRoute><Dashboard /></ProtectedRoute>
 * - Auth + Module: <ProtectedRoute modulePath="/projectlist"><ProjectList /></ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  modulePath
}) => {
  const { user, profile, modules, loading } = useAuth();

  // Show loading spinner during auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading…" />
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user) {
    console.log('🔒 ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Safety net: Block unapproved or inactive users
  if (profile && (!profile.is_approved || !profile.is_active)) {
    console.log('🚫 ProtectedRoute: User not approved or not active, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Module access check (if modulePath specified)
  if (modulePath) {
    const hasAccess = modules.some(m => m.path === modulePath);
    if (!hasAccess) {
      console.log(`🚫 ProtectedRoute: User lacks access to ${modulePath}, redirecting to dashboard`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Authorized → render children
  return <>{children}</>;
};

