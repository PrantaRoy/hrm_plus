import { useOutletContext } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { DashboardMode } from "../hooks/useDashboardMode";
import OperationsDashboard from "./dashboard/OperationsDashboard";
import StaffDashboard from "./dashboard/StaffDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { dashboardMode } = useOutletContext<{ dashboardMode: DashboardMode }>();
  const role = user?.role;

  if (role === "Admin" || role === "HR") {
    return dashboardMode === "staff" ? <StaffDashboard /> : <OperationsDashboard />;
  }
  if (role === "Manager") {
    return <OperationsDashboard />;
  }
  return <StaffDashboard />;
}
