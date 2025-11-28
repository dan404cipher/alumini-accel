import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback,
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation in useEffect to avoid setState during render
  useEffect(() => {
    // Wait for auth check to complete
    if (!loading) {
      // If user is not authenticated, redirect to login with return URL
      if (!user) {
        const returnUrl = `${location.pathname}${location.search}`;
        navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
        return;
      }

      // If role is required and user doesn't have it, redirect
      if (requiredRole && user.role !== requiredRole) {
        navigate("/dashboard", { replace: true });
        return;
      }
    }
  }, [user, loading, requiredRole, navigate, location.pathname, location.search]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, show loading while redirecting
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If role is required and user doesn't have it, show fallback or loading
  if (requiredRole && user.role !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show loading while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>;
};

// Higher-order component for role-based protection
export const withRole = (
  Component: React.ComponentType<Record<string, unknown>>,
  requiredRole: string
) => {
  return (props: Record<string, unknown>) => (
    <ProtectedRoute requiredRole={requiredRole}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Admin route component
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
};

// Alumni route component
export const AlumniRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ProtectedRoute requiredRole="alumni">{children}</ProtectedRoute>;
};

// Student route component
export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ProtectedRoute requiredRole="student">{children}</ProtectedRoute>;
};

export default ProtectedRoute;
