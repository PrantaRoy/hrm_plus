import { Navigate, Outlet } from "react-router-dom";
import { useSaasAuth } from "./SaasAuthContext";

export function RequireSaasAuth() {
  const { isAuthenticated } = useSaasAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
