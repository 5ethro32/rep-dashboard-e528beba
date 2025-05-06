
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenance } from '@/contexts/MaintenanceContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isInMaintenance } = useMaintenance();

  if (loading) {
    return (
      <div className="min-h-screen bg-finance-darkBg flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is logged in but app is in maintenance mode,
  // redirect to maintenance page
  if (isInMaintenance) {
    return <Navigate to="/maintenance" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
