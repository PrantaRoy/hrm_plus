import { PaginatedResult } from "./employee";

// Enum-like columns are plain String columns in the tenant schema; these arrays are the
// source of truth for validation (zod in the backend) and for the UI.

export const CLIENT_PRIORITIES = ["low", "medium", "high"] as const;
export type ClientPriority = (typeof CLIENT_PRIORITIES)[number];

export const PROJECT_PRIORITIES = ["low", "medium", "high"] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

export const CONTRACT_TYPES = ["hourly", "fixed"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const PROJECT_STATUSES = [
  "not_started",
  "in_progress",
  "on_hold",
  "cancelled",
  "completed",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const DEADLINE_TYPES = ["fixed", "casual"] as const;
export type DeadlineType = (typeof DEADLINE_TYPES)[number];

export const TASK_PRIORITIES = ["high", "medium", "low", "on_call"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ["to_do", "in_progress", "on_hold", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_TIME_TYPES = ["flexible", "fixed"] as const;
export type TaskTimeType = (typeof TASK_TIME_TYPES)[number];

export const RECURRENCE_FREQUENCIES = [
  "none",
  "daily",
  "weekly",
  "fortnightly",
  "monthly",
  "yearly",
  "custom",
] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const COMMENT_STATUSES = ["open", "resolved", "considered", "rejected"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

// Polymorphic owners. Stored in commentableType / attachableType (no FK, no class-name morph map).
export const COMMENTABLE_TYPES = ["task", "project"] as const;
export type CommentableType = (typeof COMMENTABLE_TYPES)[number];

export const ATTACHABLE_TYPES = ["task", "project"] as const;
export type AttachableType = (typeof ATTACHABLE_TYPES)[number];

export interface EmployeeRefDto {
  id: number;
  name: string;
}

// ── Clients ──────────────────────────────────────────────────────────────────

export interface ClientDto {
  id: number;
  name: string;
  email: string;
  companyName: string | null;
  phoneNumber: string | null;
  address: string;
  tag: string;
  priority: ClientPriority;
  isActive: boolean;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  name: string;
  email: string;
  companyName?: string | null;
  phoneNumber?: string | null;
  address: string;
  tag: string;
  priority: ClientPriority;
  isActive?: boolean;
}

export type UpdateClientInput = Partial<CreateClientInput>;

export interface ListClientsQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export type ClientPaginatedResult = PaginatedResult<ClientDto>;

// ── Projects ─────────────────────────────────────────────────────────────────

/** What the requesting user may do with this project; only present on detail/mutation responses. */
export interface ProjectViewerPermissions {
  canManage: boolean;
  canCreateTasks: boolean;
}

export interface ProjectDto {
  id: number;
  code: string;
  title: string;
  contractType: ContractType;
  clientId: number | null;
  clientName: string | null;
  status: ProjectStatus;
  totalAmount: number;
  estimatedHours: number;
  deadlineType: DeadlineType;
  startDate: string; // YYYY-MM-DD
  targetEndDate: string | null; // YYYY-MM-DD
  supervisor: EmployeeRefDto;
  priority: ProjectPriority;
  description: string;
  tags: string[];
  progressPercentage: number;
  members: EmployeeRefDto[];
  taskCount: number;
  viewer?: ProjectViewerPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  code?: string; // task-number prefix; derived from the title when omitted
  title: string;
  contractType: ContractType;
  clientId?: number | null;
  status?: ProjectStatus;
  totalAmount: number;
  estimatedHours: number;
  deadlineType: DeadlineType;
  startDate: string;
  targetEndDate?: string | null;
  supervisorId: number;
  priority: ProjectPriority;
  description?: string;
  tags?: string[];
  memberIds?: number[];
}

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, "code">>;

export interface ListProjectsQuery {
  status?: ProjectStatus;
  clientId?: number;
  supervisorId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export type ProjectPaginatedResult = PaginatedResult<ProjectDto>;

// ── Tasks ────────────────────────────────────────────────────────────────────

export interface ChecklistDto {
  id: number;
  taskId: number;
  title: string;
  isCompleted: boolean;
  isVerified: boolean;
}

/** What the requesting user may do with this task; only present on detail/mutation responses. */
export interface TaskViewerPermissions {
  canManage: boolean;
  canWork: boolean;
}

export interface TaskDto {
  id: number;
  projectId: number;
  projectTitle: string;
  taskNumber: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  timeType: TaskTimeType;
  budgetAmount: number | null;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceIntervalDays: number | null;
  totalCycles: number;
  nextRecurrenceAt: string | null;
  recurrenceParentId: number | null;
  supervisor: EmployeeRefDto;
  description: string;
  progressPercentage: number;
  dueDate: string | null;
  members: EmployeeRefDto[];
  followers: EmployeeRefDto[];
  checklists: ChecklistDto[];
  viewer?: TaskViewerPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  projectId: number;
  title: string;
  priority: TaskPriority;
  status?: TaskStatus;
  timeType: TaskTimeType;
  budgetAmount?: number | null;
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceIntervalDays?: number | null; // required when recurrenceFrequency = "custom"
  totalCycles?: number;
  supervisorId?: number; // defaults to the project supervisor
  description?: string;
  progressPercentage?: number;
  dueDate?: string | null; // ISO datetime
  memberIds?: number[];
  followerIds?: number[];
  checklist?: string[]; // initial checklist item titles
}

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, "projectId" | "checklist">>;

export interface ListTasksQuery {
  projectId?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  supervisorId?: number;
  memberId?: number;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
  page?: number;
  pageSize?: number;
}

export type TaskPaginatedResult = PaginatedResult<TaskDto>;

export interface CreateChecklistInput {
  title: string;
}

export interface UpdateChecklistInput {
  title: string;
}

export interface SetPeopleInput {
  employeeIds: number[];
}

// ── Time entries ─────────────────────────────────────────────────────────────

export interface TimeEntryDto {
  id: number;
  taskId: number;
  taskNumber: string;
  employee: EmployeeRefDto;
  startTime: string;
  endTime: string | null;
  note: string | null;
  isBillable: boolean;
  isRunning: boolean;
  durationMinutes: number | null;
}

export interface TimeEntryListDto {
  items: TimeEntryDto[];
  totalMinutes: number;
  billableMinutes: number;
}

export interface CreateTimeEntryInput {
  startTime: string;
  endTime?: string | null; // omit to start a running timer
  note?: string | null;
  isBillable?: boolean;
}

export type UpdateTimeEntryInput = Partial<CreateTimeEntryInput>;

export interface StartTimerInput {
  note?: string | null;
  isBillable?: boolean;
}

export interface StopTimerInput {
  note?: string | null;
}

// ── Comments & attachments (polymorphic) ─────────────────────────────────────

export interface AuthorRefDto {
  userId: number;
  name: string;
}

export interface CommentDto {
  id: number;
  commentableType: CommentableType;
  commentableId: number;
  author: AuthorRefDto;
  body: string;
  status: CommentStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  body: string;
  status?: CommentStatus | null;
}

export interface UpdateCommentInput {
  body?: string;
  status?: CommentStatus | null;
}

export interface AttachmentDto {
  id: number;
  attachableType: AttachableType;
  attachableId: number;
  uploader: AuthorRefDto;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
}
