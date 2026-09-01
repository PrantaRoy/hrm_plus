import {
  AvailabilityReportDto,
  CancelMeetingInput,
  CheckAvailabilityInput,
  ConfirmMeetingInput,
  CreateMeetingInput,
  ListMeetingsQuery,
  ListMyMeetingsQuery,
  MeetingDto,
  MeetingListItemDto,
  PaginatedResult,
  RespondToMeetingInput,
  UpdateMeetingInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function checkAvailability(input: CheckAvailabilityInput): Promise<AvailabilityReportDto> {
  const res = await apiClient.post<AvailabilityReportDto>("/meetings/check-availability", input);
  return res.data;
}

export async function listMyMeetings(query: ListMyMeetingsQuery = {}): Promise<MeetingListItemDto[]> {
  const res = await apiClient.get<MeetingListItemDto[]>("/meetings/my", { params: query });
  return res.data;
}

export async function listMeetings(query: ListMeetingsQuery): Promise<PaginatedResult<MeetingListItemDto>> {
  const res = await apiClient.get<PaginatedResult<MeetingListItemDto>>("/meetings", { params: query });
  return res.data;
}

export async function getMeeting(id: number): Promise<MeetingDto> {
  const res = await apiClient.get<MeetingDto>(`/meetings/${id}`);
  return res.data;
}

export async function createMeeting(input: CreateMeetingInput): Promise<MeetingDto> {
  const res = await apiClient.post<MeetingDto>("/meetings", input);
  return res.data;
}

export async function updateMeeting(id: number, input: UpdateMeetingInput): Promise<MeetingDto> {
  const res = await apiClient.patch<MeetingDto>(`/meetings/${id}`, input);
  return res.data;
}

export async function confirmMeeting(id: number, input: ConfirmMeetingInput = {}): Promise<MeetingDto> {
  const res = await apiClient.post<MeetingDto>(`/meetings/${id}/confirm`, input);
  return res.data;
}

export async function cancelMeeting(id: number, input: CancelMeetingInput = {}): Promise<MeetingDto> {
  const res = await apiClient.post<MeetingDto>(`/meetings/${id}/cancel`, input);
  return res.data;
}

export async function respondToMeeting(id: number, input: RespondToMeetingInput): Promise<MeetingDto> {
  const res = await apiClient.post<MeetingDto>(`/meetings/${id}/respond`, input);
  return res.data;
}
