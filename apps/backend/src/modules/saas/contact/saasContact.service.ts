import { z } from "zod";
import {
  ListSaasContactQuery,
  SaasContactStatus,
  SaasContactSubmissionDto,
} from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";
import { ApiError } from "../../../utils/ApiError";
import { stripHtml } from "../../../utils/sanitize";
import { submitSaasContactSchema } from "./saasContact.schemas";
import { toSaasContactSubmissionDto } from "./saasContact.mapper";

export async function submitSaasContact(
  rawInput: z.infer<typeof submitSaasContactSchema>,
  ipAddress: string | null
): Promise<SaasContactSubmissionDto> {
  const input = submitSaasContactSchema.parse(rawInput);
  const created = await controlClient.saasContactSubmission.create({
    data: {
      name: stripHtml(input.name),
      email: input.email.trim(),
      phone: input.phone ? stripHtml(input.phone) : null,
      company: input.company ? stripHtml(input.company) : null,
      subject: input.subject ? stripHtml(input.subject) : null,
      message: stripHtml(input.message),
      ipAddress: ipAddress ?? undefined,
    },
  });
  return toSaasContactSubmissionDto(created);
}

export async function listSaasContactSubmissions(
  query: ListSaasContactQuery
): Promise<SaasContactSubmissionDto[]> {
  const submissions = await controlClient.saasContactSubmission.findMany({
    where: query.status ? { status: query.status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return submissions.map(toSaasContactSubmissionDto);
}

export async function getSaasContactSubmissionById(id: number): Promise<SaasContactSubmissionDto> {
  const submission = await controlClient.saasContactSubmission.findUnique({ where: { id } });
  if (!submission) throw ApiError.notFound("Contact submission not found");
  return toSaasContactSubmissionDto(submission);
}

export async function updateSaasContactSubmissionStatus(
  id: number,
  status: SaasContactStatus
): Promise<SaasContactSubmissionDto> {
  const existing = await controlClient.saasContactSubmission.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Contact submission not found");
  const updated = await controlClient.saasContactSubmission.update({ where: { id }, data: { status } });
  return toSaasContactSubmissionDto(updated);
}

export async function deleteSaasContactSubmission(id: number): Promise<void> {
  const existing = await controlClient.saasContactSubmission.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Contact submission not found");
  await controlClient.saasContactSubmission.delete({ where: { id } });
}
