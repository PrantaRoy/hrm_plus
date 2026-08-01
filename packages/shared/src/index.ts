export { ROLES, isRoleName } from "./roles";
export type { RoleName } from "./roles";

export { GENDERS, EMPLOYMENT_TYPES, DEFAULT_RESET_PASSWORD } from "./employee";
export type {
  EmployeeStatus,
  SettingStatus,
  Gender,
  EmploymentType,
  DepartmentDto,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  EmployeeDto,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  PaginatedResult,
  ResetEmployeePasswordResponse,
} from "./employee";

export { DOCUMENT_TYPES } from "./employeeDocument";
export type {
  DocumentType,
  EmployeeDocumentDto,
  CreateEmployeeDocumentInput,
  UpdateEmployeeDocumentInput,
} from "./employeeDocument";

export type {
  ShiftDto,
  CreateShiftInput,
  UpdateShiftInput,
  WeekDayDto,
  CreateWeekDayInput,
  UpdateWeekDayInput,
  LeaveTypeDto,
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  DesignationDto,
  CreateDesignationInput,
  UpdateDesignationInput,
  RoleDto,
  CreateRoleInput,
  UpdateRoleInput,
} from "./settings";

export type {
  LoginRequest,
  AuthUser,
  LoginResponse,
  CheckEmailResponse,
  ChangePasswordInput,
  JwtAccessPayload,
  VerifyTenantResponse,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from "./auth";

export type { ApiErrorBody } from "./api";
export { TENANT_HEADER } from "./api";

export type {
  DutyScheduleDto,
  CreateDutyScheduleInput,
  UpdateDutyScheduleInput,
} from "./dutySchedule";

export { ROSTER_PERIOD_TYPES, ROSTER_STATUSES, ASSIGNMENT_STATUSES } from "./roster";
export type {
  RosterPeriodType,
  RosterStatus,
  AssignmentStatus,
  RosterDto,
  CreateRosterInput,
  UpdateRosterInput,
  AutoGenerateRosterInput,
  AutoGenerateRosterResult,
  DutyScheduleAssignmentDto,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  ListAssignmentsQuery,
} from "./roster";

export { ATTENDANCE_METHODS } from "./attendance";
export type {
  AttendanceMethod,
  AttendanceSettingsDto,
  UpdateAttendanceSettingsInput,
  EmployeeAttendanceMethodsDto,
  SetEmployeeAttendanceMethodsInput,
  BreakLogDto,
  AttendanceDto,
  CheckInInput,
  CheckOutInput,
  TodayAttendanceDto,
  ListAttendanceQuery,
  ListAttendanceItemDto,
} from "./attendance";

export { APPROVER_TYPES, LEAVE_REQUEST_STATUSES, LEAVE_APPROVAL_STATUSES } from "./leave";
export type {
  ApproverType,
  LeaveRequestStatus,
  LeaveApprovalStatus,
  ApprovalStepInput,
  ApprovalStepDto,
  EmployeeLeaveAllocationDto,
  CreateLeaveAllocationInput,
  UpdateLeaveAllocationInput,
  LeaveRequestApprovalDto,
  LeaveRequestDto,
  CreateLeaveRequestInput,
  DecideLeaveRequestInput,
  ListLeaveRequestsQuery,
} from "./leave";

export type {
  PackageDto,
  CreatePackageInput,
  UpdatePackageInput,
  ApplicationStatus,
  TenantApplicationDto,
  SubmitApplicationInput,
  UpdateApplicationInput,
  ReviewApplicationInput,
  SaasTenantStatus,
  SaasTenantDto,
  UpdateSaasTenantInput,
  SaasStats,
  SaasAdminUser,
  SaasLoginResponse,
} from "./saas";
