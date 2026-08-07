import { MoveApplicationStageInput, ApplicationDto, PipelineBoardDto } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function getPipelineBoard(jobId: number): Promise<PipelineBoardDto> {
  const res = await apiClient.get<PipelineBoardDto>("/pipeline/board", { params: { jobId } });
  return res.data;
}

export async function moveApplicationStage(applicationId: number, input: MoveApplicationStageInput): Promise<ApplicationDto> {
  const res = await apiClient.patch<ApplicationDto>(`/pipeline/applications/${applicationId}/stage`, input);
  return res.data;
}
