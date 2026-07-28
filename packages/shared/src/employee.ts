import { RoleName } from "./roles";

export type EmployeeStatus = "Active" | "Inactive";

export type SettingStatus = "Active" | "Inactive";

export interface DepartmentDto {
  id: number;
  name: string;
  status: SettingStatus;
  shortDescription: string | null;
  parentDepartmentId: number | null;
}

export interface CreateDepartmentInput {
  name: string;
  status?: SettingStatus;
  shortDescription?: string | null;
  parentDepartmentId?: number | null;
}

export interface UpdateDepartmentInput {
  name?: string;
  status?: SettingStatus;
  shortDescription?: string | null;
  parentDepartmentId?: number | null;
}

export interface EmployeeDto {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  status: EmployeeStatus;
  startDate: string;
  departmentId: number | null;
  departmentName: string | null;
  managerId: number | null;
  managerName: string | null;
  role: RoleName | null;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  startDate: string;
  departmentId?: number | null;
  managerId?: number | null;
  role: RoleName;
  password: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  jobTitle?: string | null;
  departmentId?: number | null;
  managerId?: number | null;
  status?: EmployeeStatus;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
