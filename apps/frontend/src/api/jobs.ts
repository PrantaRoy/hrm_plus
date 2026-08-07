import { CreateJobInput, JobDto, ListJobsQuery, UpdateJobInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listJobs(params: ListJobsQuery = {}): Promise<JobDto[]> {
  const res = await apiClient.get<JobDto[]>("/jobs", { params });
  return res.data;
}

export async function getJob(id: number): Promise<JobDto> {
  const res = await apiClient.get<JobDto>(`/jobs/${id}`);
  return res.data;
}

export async function createJob(input: CreateJobInput): Promise<JobDto> {
  const res = await apiClient.post<JobDto>("/jobs", input);
  return res.data;
}

export async function updateJob(id: number, input: UpdateJobInput): Promise<JobDto> {
  const res = await apiClient.patch<JobDto>(`/jobs/${id}`, input);
  return res.data;
}

export async function deleteJob(id: number): Promise<void> {
  await apiClient.delete(`/jobs/${id}`);
}

export async function publishJob(id: number): Promise<JobDto> {
  const res = await apiClient.post<JobDto>(`/jobs/${id}/publish`);
  return res.data;
}

export async function closeJob(id: number): Promise<JobDto> {
  const res = await apiClient.post<JobDto>(`/jobs/${id}/close`);
  return res.data;
}
