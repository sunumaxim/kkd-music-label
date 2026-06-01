import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

export default function AdminRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, user } = useAuth();

  if (isLoadingAuth || !authChecked) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
}