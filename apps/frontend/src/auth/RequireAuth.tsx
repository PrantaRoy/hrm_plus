import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RoleName } from "@hrm-plus/shared";
import { useAuth } from "./AuthContext";

export function RequireAuth({ roles }: { roles?: RoleName[] }) {
  const { isAuthenticated, user, mustChangePassword } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
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
