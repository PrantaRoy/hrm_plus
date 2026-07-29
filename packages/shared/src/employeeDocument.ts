import { SettingStatus } from "./employee";

export const DOCUMENT_TYPES = ["Certification", "License", "Work Permit", "Visa"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface EmployeeDocumentDto {
  id: number;
  employeeId: number;
  documentName: string;
  type: DocumentType;
  startDate: string | null;
  expiryDate: string | null;
  documentFileUrl: string | null;
  status: SettingStatus;
}

export interface CreateEmployeeDocumentInput {
  documentName: string;
  type: DocumentType;
  startDate?: string | null;
  expiryDate?: string | null;
  status?: SettingStatus;
}

export interface UpdateEmployeeDocumentInput {
  documentName?: string;
  type?: DocumentType;
  startDate?: string | null;
  expiryDate?: string | null;
  status?: SettingStatus;
}
