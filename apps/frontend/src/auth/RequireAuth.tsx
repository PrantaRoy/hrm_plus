import { Navigate, Outlet } from "react-router-dom";
import { RoleName } from "@hrm-plus/shared";
import { useAuth } from "./AuthContext";

export function RequireAuth({ roles }: { roles?: RoleName[] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
