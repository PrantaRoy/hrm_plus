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
import HolidayList from "./pages/holidays/HolidayList";
import SettingsLayout from "./pages/settings/SettingsLayout";
import GeneralSettings from "./pages/settings/GeneralSettings";
import ShiftSettings from "./pages/settings/ShiftSettings";
import WeekDaySettings from "./pages/settings/WeekDaySettings";
import LeaveTypeSettings from "./pages/settings/LeaveTypeSettings";
import DepartmentSettings from "./pages/settings/DepartmentSettings";
import DesignationSettings from "./pages/settings/DesignationSettings";
import RoleSettings from "./pages/settings/RoleSettings";
import AttendanceSettings from "./pages/settings/AttendanceSettings";
import AttendanceIpRuleSettings from "./pages/settings/AttendanceIpRuleSettings";
import AttendanceLocationList from "./pages/attendance/AttendanceLocationList";
import AttendanceLocationCreate from "./pages/attendance/AttendanceLocationCreate";
import AttendanceLocationEdit from "./pages/attendance/AttendanceLocationEdit";
import RecordsLayout from "./pages/records/RecordsLayout";
import AttendanceReport from "./pages/records/AttendanceReport";
import LeaveReport from "./pages/records/LeaveReport";
import Worksheet from "./pages/records/Worksheet";
import ManualAttendanceEntry from "./pages/records/ManualAttendanceEntry";
import DocumentTemplateList from "./pages/document-templates/DocumentTemplateList";
import DocumentTemplateCreate from "./pages/document-templates/DocumentTemplateCreate";
import DocumentTemplateEdit from "./pages/document-templates/DocumentTemplateEdit";
import RequestDocument from "./pages/documents/RequestDocument";
import MyDocumentRequests from "./pages/documents/MyDocumentRequests";
import DocumentApprovals from "./pages/documents/DocumentApprovals";
import VerifyDocument from "./pages/public/VerifyDocument";
import JobApplication from "./pages/public/JobApplication";
import CandidatePortal from "./pages/public/CandidatePortal";
import CandidateAssessment from "./pages/public/CandidateAssessment";
import JobList from "./pages/jobs/JobList";
import JobCreate from "./pages/jobs/JobCreate";
import JobEdit from "./pages/jobs/JobEdit";
import ScreeningQuestionList from "./pages/screening-questions/ScreeningQuestionList";
import PipelineBoard from "./pages/pipeline/PipelineBoard";
import AssessmentBuilder from "./pages/assessments/AssessmentBuilder";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify/:tenantSlug/:referenceNumber" element={<VerifyDocument />} />
      <Route path="/jobs/:tenantSlug/:jobSlug/apply" element={<JobApplication />} />
      <Route path="/candidate/:tenantSlug/portal" element={<CandidatePortal />} />
      <Route path="/candidate/:tenantSlug/assessment" element={<CandidateAssessment />} />

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

          <Route path="/documents/request" element={<RequestDocument />} />
          <Route path="/documents/my-requests" element={<MyDocumentRequests />} />
          <Route path="/documents/approvals" element={<DocumentApprovals />} />

          <Route element={<RequireAuth roles={["Admin", "HR"]} />}>
            <Route path="/duty-schedules" element={<DutyScheduleList />} />
            <Route path="/duty-schedules/new" element={<DutyScheduleCreate />} />
            <Route path="/duty-schedules/:id/edit" element={<DutyScheduleEdit />} />
            <Route path="/holidays" element={<HolidayList />} />
            <Route path="/document-templates" element={<DocumentTemplateList />} />
            <Route path="/document-templates/new" element={<DocumentTemplateCreate />} />
            <Route path="/document-templates/:id/edit" element={<DocumentTemplateEdit />} />
            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/new" element={<JobCreate />} />
            <Route path="/jobs/:id/edit" element={<JobEdit />} />
            <Route path="/jobs/:id/pipeline" element={<PipelineBoard />} />
            <Route path="/jobs/:id/assessment" element={<AssessmentBuilder />} />
            <Route path="/screening-questions" element={<ScreeningQuestionList />} />
          </Route>

          <Route element={<RequireAuth roles={["Admin", "HR", "Manager"]} />}>
            <Route path="/rosters" element={<RosterList />} />
            <Route path="/rosters/new" element={<RosterCreate />} />
            <Route path="/rosters/:id" element={<RosterCalendar />} />
          </Route>

          <Route element={<RequireAuth roles={["Admin", "HR"]} />}>
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/settings/general" replace />} />
              <Route path="general" element={<GeneralSettings />} />
              <Route path="shifts" element={<ShiftSettings />} />
              <Route path="weekdays" element={<WeekDaySettings />} />
              <Route path="leave-types" element={<LeaveTypeSettings />} />
              <Route path="departments" element={<DepartmentSettings />} />
              <Route path="designations" element={<DesignationSettings />} />
              <Route path="roles" element={<RoleSettings />} />
              <Route path="attendance" element={<AttendanceSettings />} />
              <Route path="attendance-ip-rules" element={<AttendanceIpRuleSettings />} />
              <Route path="attendance-locations" element={<AttendanceLocationList />} />
              <Route path="attendance-locations/new" element={<AttendanceLocationCreate />} />
              <Route path="attendance-locations/:id/edit" element={<AttendanceLocationEdit />} />
            </Route>
          </Route>

          <Route element={<RequireAuth roles={["Admin", "HR", "Manager"]} />}>
            <Route path="/records" element={<RecordsLayout />}>
              <Route index element={<Navigate to="/records/attendance" replace />} />
              <Route path="attendance" element={<AttendanceReport />} />
              <Route path="leave" element={<LeaveReport />} />
              <Route path="worksheet" element={<Worksheet />} />
            </Route>
          </Route>

          <Route element={<RequireAuth roles={["Admin", "HR"]} />}>
            <Route path="/records/attendance/manual" element={<ManualAttendanceEntry />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
