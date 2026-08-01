import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import DashboardShell from "./pages/DashboardShell";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/employees/EmployeeList";
import EmployeeCreate from "./pages/employees/EmployeeCreate";
import EmployeeDetail from "./pages/employees/EmployeeDetail";
import MySchedule from "./pages/MySchedule";
import ApplyLeave from "./pages/leave/ApplyLeave";
import MyLeaveRequests from "./pages/leave/MyLeaveRequests";
import LeaveApprovals from "./pages/leave/LeaveApprovals";
import DutyScheduleList from "./pages/duty-schedules/DutyScheduleList";
import DutyScheduleCreate from "./pages/duty-schedules/DutyScheduleCreate";
import DutyScheduleEdit from "./pages/duty-schedules/DutyScheduleEdit";
import RosterList from "./pages/rosters/RosterList";
import RosterCreate from "./pages/rosters/RosterCreate";
import RosterCalendar from "./pages/rosters/RosterCalendar";
import SettingsLayout from "./pages/settings/SettingsLayout";
import ShiftSettings from "./pages/settings/ShiftSettings";
import WeekDaySettings from "./pages/settings/WeekDaySettings";
import LeaveTypeSettings from "./pages/settings/LeaveTypeSettings";
import DepartmentSettings from "./pages/settings/DepartmentSettings";
import DesignationSettings from "./pages/settings/DesignationSettings";
import RoleSettings from "./pages/settings/RoleSettings";
import AttendanceSettings from "./pages/settings/AttendanceSettings";
import AttendanceList from "./pages/attendance/AttendanceList";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

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

          <Route path="/my-schedule" element={<MySchedule />} />

          <Route path="/leave/apply" element={<ApplyLeave />} />
          <Route path="/leave/my-requests" element={<MyLeaveRequests />} />
          <Route path="/leave/approvals" element={<LeaveApprovals />} />

          <Route element={<RequireAuth roles={["Admin", "HR"]} />}>
            <Route path="/duty-schedules" element={<DutyScheduleList />} />
            <Route path="/duty-schedules/new" element={<DutyScheduleCreate />} />
            <Route path="/duty-schedules/:id/edit" element={<DutyScheduleEdit />} />
          </Route>

          <Route element={<RequireAuth roles={["Admin", "HR", "Manager"]} />}>
            <Route path="/rosters" element={<RosterList />} />
            <Route path="/rosters/new" element={<RosterCreate />} />
            <Route path="/rosters/:id" element={<RosterCalendar />} />
          </Route>

          <Route element={<RequireAuth roles={["Admin", "HR"]} />}>
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/settings/shifts" replace />} />
              <Route path="shifts" element={<ShiftSettings />} />
              <Route path="weekdays" element={<WeekDaySettings />} />
              <Route path="leave-types" element={<LeaveTypeSettings />} />
              <Route path="departments" element={<DepartmentSettings />} />
              <Route path="designations" element={<DesignationSettings />} />
              <Route path="roles" element={<RoleSettings />} />
              <Route path="attendance" element={<AttendanceSettings />} />
            </Route>
          </Route>

          <Route element={<RequireAuth roles={["Admin", "HR", "Manager"]} />}>
            <Route path="/attendance/records" element={<AttendanceList />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
