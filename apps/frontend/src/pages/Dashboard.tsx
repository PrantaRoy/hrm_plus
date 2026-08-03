import { useAuth } from "../auth/AuthContext";
import OperationsDashboard from "./dashboard/OperationsDashboard";
import StaffDashboard from "./dashboard/StaffDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === "Admin" || user?.role === "HR" || user?.role === "Manager") {
    return <OperationsDashboard />;
  }
  return <StaffDashboard />;
}
