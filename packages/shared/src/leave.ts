import { SettingStatus } from "./employee";

export const APPROVER_TYPES = ["ReportingManager", "Role"] as const;
export type ApproverType = (typeof APPROVER_TYPES)[number];

export const LEAVE_REQUEST_STATUSES = ["Pending", "Approved", "Rejected", "Cancelled"] as const;
export type LeaveRequestStatus = (typeof LEAVE_REQUEST_STATUSES)[number];

export const LEAVE_APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"] as const;
export type LeaveApprovalStatus = (typeof LEAVE_APPROVAL_STATUSES)[number];

export interface ApprovalStepInput {
  approverType: ApproverType;
  roleId?: number;
}

export interface ApprovalStepDto {
  id: number;
  stepOrder: number;
  approverType: ApproverType;
  roleId: number | null;
  roleName: string | null;
}

export interface EmployeeLeaveAllocationDto {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  leaveTypeName: string;
  year: number;
  allocatedDays: number;
  daysUsed: number;
  remainingDays: number;
  status: SettingStatus;
  approvalSteps: ApprovalStepDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveAllocationInput {
  leaveTypeId: number;
  year: number;
  allocatedDays: number;
  approvalSteps: ApprovalStepInput[];
}

export interface UpdateLeaveAllocationInput {
  allocatedDays?: number;
  approvalSteps?: ApprovalStepInput[];
  status?: SettingStatus;
}

export interface LeaveRequestApprovalDto {
  id: number;
  stepOrder: number;
  approverType: ApproverType;
  roleId: number | null;
  roleName: string | null;
  status: LeaveApprovalStatus;
  decidedByUserId: number | null;
  decidedByName: string | null;
  decidedAt: string | null;
  comment: string | null;
}

export interface LeaveRequestDto {
  id: number;
  employeeId: number;
  employeeName: string;
  allocationId: number;
  leaveTypeId: number;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string | null;
  status: LeaveRequestStatus;
  currentStepOrder: number;
  approvals: LeaveRequestApprovalDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestInput {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface DecideLeaveRequestInput {
  comment?: string;
}

export interface ListLeaveRequestsQuery {
  status?: LeaveRequestStatus;
  employeeId?: number;
  page?: number;
  pageSize?: number;
}
