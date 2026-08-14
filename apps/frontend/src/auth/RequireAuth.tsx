import { ReactElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RoleName } from "@hrm-plus/shared";
import { useAuth } from "./AuthContext";

export function RequireAuth({ roles, publicFallback }: { roles?: RoleName[]; publicFallback?: ReactElement }) {
  const { isAuthenticated, user, mustChangePassword } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (publicFallback) return publicFallback;
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
