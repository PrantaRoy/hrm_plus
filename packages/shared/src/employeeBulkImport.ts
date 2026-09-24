import { Gender } from "./employee";
import { EmployeeDto } from "./employee";

export const GENDER_CODES = ["M", "F", "O", "N"] as const;
export type GenderCode = (typeof GENDER_CODES)[number];

export const GENDER_CODE_MAP: Record<GenderCode, Gender> = {
  M: "Male",
  F: "Female",
  O: "Other",
  N: "Not Specified",
};

export interface BulkImportRowError {
  row: number;
  messages: string[];
}

export interface BulkImportEmployeesResult {
  createdCount: number;
  employees: EmployeeDto[];
}

export interface BulkImportEmployeesFormFields {
  departmentId?: number | null;
  designationId?: number | null;
  role: string;
}
