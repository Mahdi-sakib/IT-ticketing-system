import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Loading from "@/components/Loading";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session..." />;
  if (!isAuthenticated) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
