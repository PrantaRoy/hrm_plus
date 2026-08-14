import { SettingStatus } from "./employee";
import { APPROVER_TYPES } from "./leave";

// Documents additionally support "Self" (the requester attests/signs for themselves,
// e.g. an asset receipt acknowledgement) — a case the leave-approval chain has no use
// for, so it's kept as a document-only superset rather than widening the shared
// ApproverType used by leave allocations.
export const DOCUMENT_APPROVER_TYPES = [...APPROVER_TYPES, "Self"] as const;
export type DocumentApproverType = (typeof DOCUMENT_APPROVER_TYPES)[number];

export const DOCUMENT_REQUEST_STATUSES = ["Pending", "Approved", "Issued", "Rejected", "Cancelled"] as const;
export type DocumentRequestStatus = (typeof DOCUMENT_REQUEST_STATUSES)[number];

export const DOCUMENT_APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"] as const;
export type DocumentApprovalStatus = (typeof DOCUMENT_APPROVAL_STATUSES)[number];

export const DOCUMENT_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type DocumentPriority = (typeof DOCUMENT_PRIORITIES)[number];

export interface DocumentCategoryDto {
  id: number;
  code: string;
  name: string;
  status: SettingStatus;
}

export interface DocumentTemplateApprovalStepInput {
  approverType: DocumentApproverType;
  roleId?: number;
}

export interface DocumentTemplateApprovalStepDto {
  id: number;
  stepOrder: number;
  approverType: DocumentApproverType;
  roleId: number | null;
  roleName: string | null;
}

export interface DocumentTemplateDto {
  id: number;
  shortCode: string;
  name: string;
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  bodyHtml: string;
  isStaffRequestable: boolean;
  status: SettingStatus;
  approvalSteps: DocumentTemplateApprovalStepDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentTemplateInput {
  shortCode: string;
  name: string;
  categoryId: number;
  bodyHtml: string;
  isStaffRequestable?: boolean;
  approvalSteps: DocumentTemplateApprovalStepInput[];
}

export interface UpdateDocumentTemplateInput {
  name?: string;
  bodyHtml?: string;
  isStaffRequestable?: boolean;
  status?: SettingStatus;
  approvalSteps?: DocumentTemplateApprovalStepInput[];
}

export interface DocumentRequestApprovalDto {
  id: number;
  stepOrder: number;
  approverType: DocumentApproverType;
  roleId: number | null;
  roleName: string | null;
  status: DocumentApprovalStatus;
  decidedByUserId: number | null;
  decidedByName: string | null;
  decidedAt: string | null;
  comment: string | null;
}

export interface DocumentRequestDto {
  id: number;
  employeeId: number;
  employeeName: string;
  templateId: number;
  templateName: string;
  templateShortCode: string;
  categoryCode: string;
  categoryName: string;
  reason: string | null;
  priority: DocumentPriority;
  deadlineDate: string | null;
  attachmentFileUrl: string | null;
  fieldValues: Record<string, unknown> | null;
  status: DocumentRequestStatus;
  currentStepOrder: number;
  referenceNumber: string | null;
  issuedAt: string | null;
  approvals: DocumentRequestApprovalDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequestInput {
  templateId: number;
  reason?: string;
  priority?: DocumentPriority;
  deadlineDate?: string;
}

export interface DecideDocumentRequestInput {
  comment?: string;
}

export interface UpdateDocumentRequestFieldValuesInput {
  fieldValues: Record<string, unknown>;
}

export interface ListDocumentRequestsQuery {
  status?: DocumentRequestStatus;
  employeeId?: number;
  templateId?: number;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

export interface PublicDocumentVerificationDto {
  valid: boolean;
  referenceNumber: string;
  documentTypeName: string | null;
  issuedToName: string | null;
  issuedAt: string | null;
}
