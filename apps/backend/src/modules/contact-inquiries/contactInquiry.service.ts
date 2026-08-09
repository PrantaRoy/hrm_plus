import { PrismaClient, Prisma } from "../../../generated/tenant";
import { ContactInquiryDto, ListContactInquiriesQuery, SubmitContactInquiryInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { stripHtml } from "../../utils/sanitize";
import { toContactInquiryDto } from "./contactInquiry.mapper";

export async function submitContactInquiry(
  prisma: PrismaClient,
  input: SubmitContactInquiryInput,
  ipAddress: string | null
): Promise<ContactInquiryDto> {
  const created = await prisma.contactInquiry.create({
    data: {
      name: stripHtml(input.name),
      email: input.email.trim(),
      phone: input.phone ? stripHtml(input.phone) : undefined,
      subject: input.subject ? stripHtml(input.subject) : undefined,
      message: stripHtml(input.message),
      ipAddress: ipAddress ?? undefined,
    },
  });
  return toContactInquiryDto(created);
}

export async function listContactInquiries(
  prisma: PrismaClient,
  query: ListContactInquiriesQuery
): Promise<ContactInquiryDto[]> {
  const where: Prisma.ContactInquiryWhereInput = query.status ? { status: query.status } : {};
  const inquiries = await prisma.contactInquiry.findMany({ where, orderBy: { createdAt: "desc" } });
  return inquiries.map(toContactInquiryDto);
}

export async function getContactInquiryById(prisma: PrismaClient, id: number): Promise<ContactInquiryDto> {
  const inquiry = await prisma.contactInquiry.findUnique({ where: { id } });
  if (!inquiry) {
    throw ApiError.notFound("Contact inquiry not found");
  }
  return toContactInquiryDto(inquiry);
}

export async function updateContactInquiryStatus(
  prisma: PrismaClient,
  id: number,
  status: string
): Promise<ContactInquiryDto> {
  const existing = await prisma.contactInquiry.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Contact inquiry not found");
  }
  const updated = await prisma.contactInquiry.update({ where: { id }, data: { status } });
  return toContactInquiryDto(updated);
}

export async function deleteContactInquiry(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.contactInquiry.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Contact inquiry not found");
  }
  await prisma.contactInquiry.delete({ where: { id } });
}
