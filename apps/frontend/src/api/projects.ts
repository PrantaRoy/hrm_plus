import {
  CreateProjectInput,
  ListProjectsQuery,
  ProjectDto,
  ProjectPaginatedResult,
  UpdateProjectInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listProjects(query: ListProjectsQuery = {}): Promise<ProjectPaginatedResult> {
  const res = await apiClient.get<ProjectPaginatedResult>("/projects", { params: query });
  return res.data;
}

export async function getProject(id: number): Promise<ProjectDto> {
  const res = await apiClient.get<ProjectDto>(`/projects/${id}`);
  return res.data;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDto> {
  const res = await apiClient.post<ProjectDto>("/projects", input);
  return res.data;
}

export async function updateProject(id: number, input: UpdateProjectInput): Promise<ProjectDto> {
  const res = await apiClient.patch<ProjectDto>(`/projects/${id}`, input);
  return res.data;
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}
