// File: ProtectedRoute component
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student' | 'super_admin';
  allowedRoles?: ('admin' | 'student' | 'super_admin')[];
}

// Responsive skeleton layout with matching background color
function SkeletonProtectedLayout() {
  return (
    <div
      className="min-h-screen text-gray-900 dark:text-gray-100"
      style={{ backgroundColor: '#334155' }} // Dark navy background matching your image
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex flex-col md:flex-row animate-pulse">
        {/* Top bar (mobile) */}
        <div className="md:hidden h-14 w-full bg-white/10 backdrop-blur border-b border-white/20 flex items-center px-4">
          <div className="h-6 w-28 bg-white/20 rounded" />
          <div className="ml-auto h-8 w-8 bg-white/20 rounded-full" />
        </div>

        {/* Sidebar (md+) */}
        <aside className="hidden md:flex md:flex-col md:w-64 border-r border-white/20 bg-white/10 backdrop-blur p-4 gap-3">
          <div className="h-8 w-32 bg-white/20 rounded mb-4" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-9 w-full bg-white/20 rounded" />
          ))}
          <div className="mt-auto">
            <div className="h-9 w-full bg-white/20 rounded" />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {/* Breadcrumb / header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-24 bg-white/20 rounded" />
            <div className="h-4 w-4 bg-white/20 rounded" />
            <div className="h-4 w-32 bg-white/20 rounded" />
          </div>

          {/* Title + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="h-8 w-48 bg-white/20 rounded" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-white/20 rounded" />
              <div className="h-9 w-24 bg-white/20 rounded" />
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4">
                <div className="h-5 w-32 bg-white/20 rounded mb-3" />
                <div className="h-4 w-20 bg-white/20 rounded mb-2" />
                <div className="h-4 w-full bg-white/20 rounded mb-2" />
                <div className="h-4 w-3/4 bg-white/20 rounded" />
                <div className="mt-4 h-9 w-24 bg-white/20 rounded" />
              </div>
            ))}
          </div>

          {/* Table/list skeleton */}
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4">
            <div className="h-6 w-40 bg-white/20 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded" />
                  <div className="flex-1">
                    <div className="h-4 w-2/3 bg-white/20 rounded mb-2" />
                    <div className="h-4 w-1/3 bg-white/20 rounded" />
                  </div>
                  <div className="h-8 w-20 bg-white/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles 
}) => {
  const { isAuthenticated, user, loading, hydrated } = useSelector((state: RootState) => state.auth);

  // Gate by hydration first to avoid early redirect on first render
  if (!hydrated) {
    return <SkeletonProtectedLayout />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/management/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/management/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role as any)) {
    return <Navigate to="/management/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
