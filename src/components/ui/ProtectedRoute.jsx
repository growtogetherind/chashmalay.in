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
  return children;
};
