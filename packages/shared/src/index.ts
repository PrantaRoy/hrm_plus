export { ROLES, isRoleName } from "./roles";
export type { RoleName } from "./roles";

export type {
  EmployeeStatus,
  DepartmentDto,
  EmployeeDto,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  PaginatedResult,
} from "./employee";

export type { LoginRequest, AuthUser, LoginResponse, JwtAccessPayload } from "./auth";

export type { ApiErrorBody } from "./api";
export { TENANT_HEADER } from "./api";
