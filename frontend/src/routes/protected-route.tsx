import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Skeleton } from '@/components/ui/skeleton';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}

export function OrganizerRoute() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (user?.role !== 'ORGANIZER' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (user?.role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
