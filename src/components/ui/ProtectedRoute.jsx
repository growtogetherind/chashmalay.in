import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Requires the user to be logged in
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary-blue font-black">Loading...</div>;
  if (!user) return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  return children;
};

// Requires the user to be an admin
export const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading, profileLoading } = useAuth();
  
  if (loading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center text-primary-blue font-black bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="uppercase tracking-[0.2em] text-xs">Verifying Admin Access</p>
      </div>
    </div>;
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};
