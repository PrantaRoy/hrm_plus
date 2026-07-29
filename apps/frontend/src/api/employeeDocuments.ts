import {
  CreateEmployeeDocumentInput,
  EmployeeDocumentDto,
  UpdateEmployeeDocumentInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listEmployeeDocuments(employeeId: number): Promise<EmployeeDocumentDto[]> {
  const res = await apiClient.get<EmployeeDocumentDto[]>(`/employees/${employeeId}/documents`);
  return res.data;
}

export async function createEmployeeDocument(
  employeeId: number,
  input: CreateEmployeeDocumentInput,
  file: File
): Promise<EmployeeDocumentDto> {
  const formData = new FormData();
  formData.append("documentName", input.documentName);
  formData.append("type", input.type);
  if (input.startDate) formData.append("startDate", input.startDate);
  if (input.expiryDate) formData.append("expiryDate", input.expiryDate);
  if (input.status) formData.append("status", input.status);
  formData.append("file", file);

  const res = await apiClient.post<EmployeeDocumentDto>(`/employees/${employeeId}/documents`, formData);
  return res.data;
}

export async function updateEmployeeDocument(
  employeeId: number,
  docId: number,
  input: UpdateEmployeeDocumentInput
): Promise<EmployeeDocumentDto> {
  const res = await apiClient.patch<EmployeeDocumentDto>(
    `/employees/${employeeId}/documents/${docId}`,
    input
  );
  return res.data;
}

export async function deleteEmployeeDocument(employeeId: number, docId: number): Promise<void> {
  await apiClient.delete(`/employees/${employeeId}/documents/${docId}`);
}
