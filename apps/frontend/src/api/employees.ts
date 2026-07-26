import {
  CreateEmployeeInput,
  EmployeeDto,
  PaginatedResult,
  UpdateEmployeeInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export interface ListEmployeesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: number;
}

export async function listEmployees(
  params: ListEmployeesParams
): Promise<PaginatedResult<EmployeeDto>> {
  const res = await apiClient.get<PaginatedResult<EmployeeDto>>("/employees", { params });
  return res.data;
}

export async function getEmployee(id: number): Promise<EmployeeDto> {
  const res = await apiClient.get<EmployeeDto>(`/employees/${id}`);
  return res.data;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<EmployeeDto> {
  const res = await apiClient.post<EmployeeDto>("/employees", input);
  return res.data;
}

export async function updateEmployee(id: number, input: UpdateEmployeeInput): Promise<EmployeeDto> {
  const res = await apiClient.patch<EmployeeDto>(`/employees/${id}`, input);
  return res.data;
}
