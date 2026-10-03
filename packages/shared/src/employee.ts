import { RoleName } from "./roles";

export type EmployeeStatus = "Active" | "Inactive";

export type SettingStatus = "Active" | "Inactive";

export const DEFAULT_RESET_PASSWORD = "12345678";

export interface ResetEmployeePasswordResponse {
  newPassword: string;
}

export const GENDERS = ["Male", "Female", "Other", "Not Specified"] as const;
export type Gender = (typeof GENDERS)[number];

export const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Intern", "Casual"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

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
  phoneNumber: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  jobTitle: string | null;
  status: EmployeeStatus;
  joiningDate: string;
  terminationDate: string | null;
  employmentType: EmploymentType;
  irdNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  avatarUrl: string | null;
  departmentId: number | null;
  departmentName: string | null;
  designationId: number | null;
  designationName: string | null;
  reportingToId: number | null;
  reportingToName: string | null;
  role: RoleName | null;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  gender?: Gender;
  dateOfBirth?: string;
  jobTitle?: string;
  joiningDate: string;
  employmentType?: EmploymentType;
  irdNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  departmentId?: number | null;
  designationId?: number | null;
  reportingToId?: number | null;
  role: RoleName;
  password: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  jobTitle?: string | null;
  terminationDate?: string | null;
  employmentType?: EmploymentType;
  irdNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  departmentId?: number | null;
  designationId?: number | null;
  reportingToId?: number | null;
  status?: EmployeeStatus;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
