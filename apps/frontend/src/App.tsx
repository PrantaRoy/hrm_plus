import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import DashboardShell from "./pages/DashboardShell";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/employees/EmployeeList";
import EmployeeCreate from "./pages/employees/EmployeeCreate";
import EmployeeDetail from "./pages/employees/EmployeeDetail";
import SettingsLayout from "./pages/settings/SettingsLayout";
import ShiftSettings from "./pages/settings/ShiftSettings";
import WeekDaySettings from "./pages/settings/WeekDaySettings";
import LeaveTypeSettings from "./pages/settings/LeaveTypeSettings";
import DepartmentSettings from "./pages/settings/DepartmentSettings";
import DesignationSettings from "./pages/settings/DesignationSettings";
import RoleSettings from "./pages/settings/RoleSettings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<DashboardShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route
            path="/employees/new"
            element={
              <RequireAuth roles={["Admin", "HR"]} />
            }
          >
            <Route index element={<EmployeeCreate />} />
          </Route>
          <Route path="/employees/:id" element={<EmployeeDetail />} />

          <Route element={<RequireAuth roles={["Admin", "HR"]} />}>
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/settings/shifts" replace />} />
              <Route path="shifts" element={<ShiftSettings />} />
              <Route path="weekdays" element={<WeekDaySettings />} />
              <Route path="leave-types" element={<LeaveTypeSettings />} />
              <Route path="departments" element={<DepartmentSettings />} />
              <Route path="designations" element={<DesignationSettings />} />
              <Route path="roles" element={<RoleSettings />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
