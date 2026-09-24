import {
  ChecklistDto,
  CreateTaskInput,
  CreateTimeEntryInput,
  ListTasksQuery,
  MyWorkDashboardDto,
  TaskDto,
  TaskPaginatedResult,
  TimeEntryDto,
  TimeEntryListDto,
  UpdateTaskInput,
  UpdateTimeEntryInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listTasks(query: ListTasksQuery = {}): Promise<TaskPaginatedResult> {
  const res = await apiClient.get<TaskPaginatedResult>("/tasks", { params: query });
  return res.data;
}

export async function listMyTasks(query: ListTasksQuery = {}): Promise<TaskPaginatedResult> {
  const res = await apiClient.get<TaskPaginatedResult>("/tasks/my", { params: query });
  return res.data;
}

export async function getMyWorkDashboard(): Promise<MyWorkDashboardDto> {
  const res = await apiClient.get<MyWorkDashboardDto>("/tasks/dashboard");
  return res.data;
}

export async function getTask(id: number): Promise<TaskDto> {
  const res = await apiClient.get<TaskDto>(`/tasks/${id}`);
  return res.data;
}

export async function createTask(input: CreateTaskInput): Promise<TaskDto> {
  const res = await apiClient.post<TaskDto>("/tasks", input);
  return res.data;
}

export async function updateTask(id: number, input: UpdateTaskInput): Promise<TaskDto> {
  const res = await apiClient.patch<TaskDto>(`/tasks/${id}`, input);
  return res.data;
}

export async function deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}

// ── Checklist ───────────────────────────────────────────────────────────────

export async function addChecklistItem(taskId: number, title: string): Promise<ChecklistDto> {
  const res = await apiClient.post<ChecklistDto>(`/tasks/${taskId}/checklists`, { title });
  return res.data;
}

export async function deleteChecklistItem(taskId: number, itemId: number): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}/checklists/${itemId}`);
}

export async function setChecklistCompleted(taskId: number, itemId: number, value: boolean): Promise<ChecklistDto> {
  const res = await apiClient.post<ChecklistDto>(`/tasks/${taskId}/checklists/${itemId}/complete`, { value });
  return res.data;
}

export async function setChecklistVerified(taskId: number, itemId: number, value: boolean): Promise<ChecklistDto> {
  const res = await apiClient.post<ChecklistDto>(`/tasks/${taskId}/checklists/${itemId}/verify`, { value });
  return res.data;
}

// ── Time entries ────────────────────────────────────────────────────────────

export async function listTimeEntries(taskId: number): Promise<TimeEntryListDto> {
  const res = await apiClient.get<TimeEntryListDto>(`/tasks/${taskId}/time-entries`);
  return res.data;
}

export async function createTimeEntry(taskId: number, input: CreateTimeEntryInput): Promise<TimeEntryDto> {
  const res = await apiClient.post<TimeEntryDto>(`/tasks/${taskId}/time-entries`, input);
  return res.data;
}

export async function startTimer(taskId: number): Promise<TimeEntryDto> {
  const res = await apiClient.post<TimeEntryDto>(`/tasks/${taskId}/time-entries/start`, {});
  return res.data;
}

export async function stopTimer(taskId: number): Promise<TimeEntryDto> {
  const res = await apiClient.post<TimeEntryDto>(`/tasks/${taskId}/time-entries/stop`, {});
  return res.data;
}

export async function updateTimeEntry(entryId: number, input: UpdateTimeEntryInput): Promise<TimeEntryDto> {
  const res = await apiClient.patch<TimeEntryDto>(`/tasks/time-entries/${entryId}`, input);
  return res.data;
}

export async function deleteTimeEntry(entryId: number): Promise<void> {
  await apiClient.delete(`/tasks/time-entries/${entryId}`);
}
