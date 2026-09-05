import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { useTenantSubdomain } from "./hooks/useTenantSubdomain";
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
import MyMeetings from "./pages/meetings/MyMeetings";
import ScheduleMeeting from "./pages/meetings/ScheduleMeeting";
import MeetingDetail from "./pages/meetings/MeetingDetail";
import EditMeeting from "./pages/meetings/EditMeeting";
import AllMeetings from "./pages/meetings/AllMeetings";
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
import AiSettings from "./pages/settings/AiSettings";
import ShiftSettings from "./pages/settings/ShiftSettings";
import WeekDaySettings from "./pages/settings/WeekDaySettings";
import LeaveTypeSettings from "./pages/settings/LeaveTypeSettings";
import DepartmentSettings from "./pages/settings/DepartmentSettings";
import DesignationSettings from "./pages/settings/DesignationSettings";
import RoleSettings from "./pages/settings/RoleSettings";
import AttendanceSettings from "./pages/settings/AttendanceSettings";
import SchedulerSettings from "./pages/settings/SchedulerSettings";
import AttendanceIpRuleSettings from "./pages/settings/AttendanceIpRuleSettings";
import AttendanceLocationList from "./pages/attendance/AttendanceLocationList";
import AttendanceLocationCreate from "./pages/attendance/AttendanceLocationCreate";
import AttendanceLocationEdit from "./pages/attendance/AttendanceLocationEdit";
import RecordsLayout from "./pages/records/RecordsLayout";
import AttendanceReport from "./pages/records/AttendanceReport";
import LeaveReport from "./pages/records/LeaveReport";
import Worksheet from "./pages/records/Worksheet";
import ManualAttendanceEntry from "./pages/records/ManualAttendanceEntry";
import MyRecordsLayout from "./pages/records/MyRecordsLayout";
import MyAttendanceReport from "./pages/records/MyAttendanceReport";
import MyWorksheet from "./pages/records/MyWorksheet";
import MyAssets from "./pages/assets/MyAssets";
import DocumentTemplateList from "./pages/document-templates/DocumentTemplateList";
import DocumentTemplateCreate from "./pages/document-templates/DocumentTemplateCreate";
import DocumentTemplateEdit from "./pages/document-templates/DocumentTemplateEdit";
import RequestDocument from "./pages/documents/RequestDocument";
import MyDocumentRequests from "./pages/documents/MyDocumentRequests";
import DocumentApprovals from "./pages/documents/DocumentApprovals";
import VerifyDocument from "./pages/public/VerifyDocument";
import MyTickets from "./pages/support-tickets/MyTickets";
import NewTicket from "./pages/support-tickets/NewTicket";
import TicketDetail from "./pages/support-tickets/TicketDetail";
import JobApplication from "./pages/public/JobApplication";
import CandidatePortal from "./pages/public/CandidatePortal";
import CandidateAssessment from "./pages/public/CandidateAssessment";
import JobList from "./pages/jobs/JobList";
import JobCreate from "./pages/jobs/JobCreate";
import JobEdit from "./pages/jobs/JobEdit";
import ScreeningQuestionList from "./pages/screening-questions/ScreeningQuestionList";
import PipelineBoard from "./pages/pipeline/PipelineBoard";
import AssessmentBuilder from "./pages/assessments/AssessmentBuilder";
import SiteSettingsForm from "./pages/website-cms/SiteSettingsForm";
import SiteSectionList from "./pages/website-cms/SiteSectionList";
import HeroSlideList from "./pages/website-cms/HeroSlideList";
import HeroSlideCreate from "./pages/website-cms/HeroSlideCreate";
import HeroSlideEdit from "./pages/website-cms/HeroSlideEdit";
import CompanyServiceList from "./pages/website-cms/CompanyServiceList";
import CompanyServiceCreate from "./pages/website-cms/CompanyServiceCreate";
import CompanyServiceEdit from "./pages/website-cms/CompanyServiceEdit";
import GalleryItemList from "./pages/website-cms/GalleryItemList";
import GalleryItemCreate from "./pages/website-cms/GalleryItemCreate";
import GalleryItemEdit from "./pages/website-cms/GalleryItemEdit";
import BlogPostList from "./pages/website-cms/BlogPostList";
import BlogPostCreate from "./pages/website-cms/BlogPostCreate";
import BlogPostEdit from "./pages/website-cms/BlogPostEdit";
import ContactInquiryList from "./pages/website-cms/ContactInquiryList";
import SocialLinkList from "./pages/website-cms/SocialLinkList";
import LegalPageList from "./pages/website-cms/LegalPageList";
import LegalPageCreate from "./pages/website-cms/LegalPageCreate";
import LegalPageEdit from "./pages/website-cms/LegalPageEdit";
import PublicSiteProviders from "./pages/public-site/PublicSiteProviders";
import PublicSiteHome from "./pages/public-site/PublicSiteHome";
import PublicBlogPost from "./pages/public-site/PublicBlogPost";
import PublicLegalPage from "./pages/public-site/PublicLegalPage";
import AssetList from "./pages/assets/AssetList";
import AssetCreate from "./pages/assets/AssetCreate";
import AssetDetail from "./pages/assets/AssetDetail";
import AssetEdit from "./pages/assets/AssetEdit";
import OffboardingChecklist from "./pages/assets/OffboardingChecklist";
import PayCycleSettings from "./pages/payroll/PayCycleSettings";
import PayRates from "./pages/payroll/PayRates";
import WorkReports from "./pages/payroll/WorkReports";
import PayrollRuns from "./pages/payroll/PayrollRuns";
import PayrollRunDetail from "./pages/payroll/PayrollRunDetail";
import PayrollSettingsPage from "./pages/payroll/PayrollSettingsPage";
import MyPayslips from "./pages/payroll/MyPayslips";

export default function App() {
  const tenantSlug = useTenantSubdomain();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify/:tenantSlug/:referenceNumber" element={<VerifyDocument />} />
      <Route path="/jobs/:tenantSlug/:jobSlug/apply" element={<JobApplication />} />
      <Route path="/candidate/:tenantSlug/portal" element={<CandidatePortal />} />
      <Route path="/candidate/:tenantSlug/assessment" element={<CandidateAssessment />} />
      <Route element={<PublicSiteProviders />}>
        <Route path="/site/:tenantSlug" element={<PublicSiteHome />} />
        <Route path="/site/:tenantSlug/blog/:slug" element={<PublicBlogPost />} />
        <Route path="/site/:tenantSlug/legal/:legalSlug" element={<PublicLegalPage />} />
        <Route path="/blog/:slug" element={<PublicBlogPost />} />
        <Route path="/legal/:legalSlug" element={<PublicLegalPage />} />
      </Route>

      <Route
        element={
          <RequireAuth
            publicFallback={tenantSlug ? <PublicSiteProviders><PublicSiteHome /></PublicSiteProviders> : undefined}
          />
        }
      >
        <Route element={<DashboardShell />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<DashboardShell />}>
          <Route element={<RequireAuth roles={["Admin", "HR", "Manager"]} />}>
            <Route path="/employees" element={<EmployeeList />} />
          </Route>
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

          <Route path="/meetings" element={<MyMeetings />} />
          <Route path="/meetings/new" element={<ScheduleMeeting />} />
          <Route element={<RequireAuth roles={["Admin", "HR", "Manager"]} />}>
            <Route path="/meetings/all" element={<AllMeetings />} />
          </Route>
          <Route path="/meetings/:id" element={<MeetingDetail />} />
          <Route path="/meetings/:id/edit" element={<EditMeeting />} />

          <Route path="/documents/request" element={<RequestDocument />} />
          <Route path="/documents/my-requests" element={<MyDocumentRequests />} />
          <Route path="/documents/approvals" element={<DocumentApprovals />} />

          <Route element={<RequireAuth roles={["Admin"]} />}>
            <Route path="/support-tickets" element={<MyTickets />} />
            <Route path="/support-tickets/new" element={<NewTicket />} />
            <Route path="/support-tickets/:id" element={<TicketDetail />} />
          </Route>

          <Route element={<RequireAuth roles={["Admin", "HR", "Manager"]} />}>
            <Route path="/assets" element={<AssetList />} />
          </Route>
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/my-assets" element={<MyAssets />} />

          <Route path="/my-records" element={<MyRecordsLayout />}>
            <Route index element={<Navigate to="/my-records/attendance" replace />} />
            <Route path="attendance" element={<MyAttendanceReport />} />
            <Route path="leave" element={<MyLeaveRequests />} />
            <Route path="worksheet" element={<MyWorksheet />} />
          </Route>

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

            <Route path="/assets/new" element={<AssetCreate />} />
            <Route path="/assets/:id/edit" element={<AssetEdit />} />
            <Route path="/assets/offboarding/:employeeId" element={<OffboardingChecklist />} />

            <Route path="/website-cms/settings" element={<SiteSettingsForm />} />
            <Route path="/website-cms/sections" element={<SiteSectionList />} />
            <Route path="/website-cms/hero-slides" element={<HeroSlideList />} />
            <Route path="/website-cms/hero-slides/new" element={<HeroSlideCreate />} />
            <Route path="/website-cms/hero-slides/:id/edit" element={<HeroSlideEdit />} />
            <Route path="/website-cms/services" element={<CompanyServiceList />} />
            <Route path="/website-cms/services/new" element={<CompanyServiceCreate />} />
            <Route path="/website-cms/services/:id/edit" element={<CompanyServiceEdit />} />
            <Route path="/website-cms/gallery" element={<GalleryItemList />} />
            <Route path="/website-cms/gallery/new" element={<GalleryItemCreate />} />
            <Route path="/website-cms/gallery/:id/edit" element={<GalleryItemEdit />} />
            <Route path="/website-cms/blog" element={<BlogPostList />} />
            <Route path="/website-cms/blog/new" element={<BlogPostCreate />} />
            <Route path="/website-cms/blog/:id/edit" element={<BlogPostEdit />} />
            <Route path="/website-cms/contact-inquiries" element={<ContactInquiryList />} />
            <Route path="/website-cms/social-links" element={<SocialLinkList />} />
            <Route path="/website-cms/legal-pages" element={<LegalPageList />} />
            <Route path="/website-cms/legal-pages/new" element={<LegalPageCreate />} />
            <Route path="/website-cms/legal-pages/:id/edit" element={<LegalPageEdit />} />
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
              <Route path="scheduler" element={<SchedulerSettings />} />
              <Route path="attendance-ip-rules" element={<AttendanceIpRuleSettings />} />
              <Route path="attendance-locations" element={<AttendanceLocationList />} />
              <Route path="attendance-locations/new" element={<AttendanceLocationCreate />} />
              <Route path="attendance-locations/:id/edit" element={<AttendanceLocationEdit />} />
              <Route element={<RequireAuth roles={["Admin"]} />}>
                <Route path="ai" element={<AiSettings />} />
              </Route>
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

          <Route path="/payroll/my-payslips" element={<MyPayslips />} />

          <Route element={<RequireAuth roles={["Admin", "HR", "Payroll"]} />}>
            <Route path="/payroll/pay-cycles" element={<PayCycleSettings />} />
            <Route path="/payroll/pay-rates" element={<PayRates />} />
            <Route path="/payroll/work-reports" element={<WorkReports />} />
          </Route>

          <Route element={<RequireAuth roles={["Admin", "Payroll", "Finance"]} />}>
            <Route path="/payroll/runs" element={<PayrollRuns />} />
            <Route path="/payroll/runs/:id" element={<PayrollRunDetail />} />
          </Route>

          <Route element={<RequireAuth roles={["Admin", "Payroll"]} />}>
            <Route path="/payroll/settings" element={<PayrollSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
