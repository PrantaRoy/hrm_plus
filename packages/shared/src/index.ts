export { ROLES, isRoleName } from "./roles";
export type { RoleName } from "./roles";

export type {
  EmployeeStatus,
  SettingStatus,
  DepartmentDto,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  EmployeeDto,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  PaginatedResult,
} from "./employee";

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
} from "./auth";

export type { ApiErrorBody } from "./api";
export { TENANT_HEADER } from "./api";

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
