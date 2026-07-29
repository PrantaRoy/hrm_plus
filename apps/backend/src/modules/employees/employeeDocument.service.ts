import { PrismaClient } from "../../../generated/tenant";
import {
  CreateEmployeeDocumentInput,
  EmployeeDocumentDto,
  UpdateEmployeeDocumentInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";

function toEmployeeDocumentDto(doc: {
  id: number;
  employeeId: number;
  documentName: string;
  type: string;
  startDate: Date | null;
  expiryDate: Date | null;
  documentFileUrl: string | null;
  status: string;
}): EmployeeDocumentDto {
  return {
    id: doc.id,
    employeeId: doc.employeeId,
    documentName: doc.documentName,
    type: doc.type as EmployeeDocumentDto["type"],
    startDate: doc.startDate ? doc.startDate.toISOString() : null,
    expiryDate: doc.expiryDate ? doc.expiryDate.toISOString() : null,
    documentFileUrl: doc.documentFileUrl,
    status: doc.status as EmployeeDocumentDto["status"],
  };
}

async function ensureEmployeeExists(prisma: PrismaClient, employeeId: number): Promise<void> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw ApiError.notFound("Employee not found");
  }
}

export async function listEmployeeDocuments(
  prisma: PrismaClient,
  employeeId: number
): Promise<EmployeeDocumentDto[]> {
  await ensureEmployeeExists(prisma, employeeId);
  const docs = await prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });
  return docs.map(toEmployeeDocumentDto);
}

export async function getEmployeeDocumentById(
  prisma: PrismaClient,
  employeeId: number,
  docId: number
): Promise<EmployeeDocumentDto> {
  const doc = await prisma.employeeDocument.findFirst({ where: { id: docId, employeeId } });
  if (!doc) {
    throw ApiError.notFound("Document not found");
  }
  return toEmployeeDocumentDto(doc);
}

export async function createEmployeeDocument(
  prisma: PrismaClient,
  employeeId: number,
  input: CreateEmployeeDocumentInput,
  file: { buffer: Buffer; originalName: string; mimeType: string }
): Promise<EmployeeDocumentDto> {
  await ensureEmployeeExists(prisma, employeeId);

  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: "employee-documents",
  });

  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId,
      documentName: input.documentName,
      type: input.type,
      startDate: input.startDate ? new Date(input.startDate) : null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      status: input.status ?? "Active",
      documentFileUrl: stored.url,
      documentFileKey: stored.key,
    },
  });

  return toEmployeeDocumentDto(doc);
}

export async function updateEmployeeDocument(
  prisma: PrismaClient,
  employeeId: number,
  docId: number,
  input: UpdateEmployeeDocumentInput
): Promise<EmployeeDocumentDto> {
  const existing = await prisma.employeeDocument.findFirst({ where: { id: docId, employeeId } });
  if (!existing) {
    throw ApiError.notFound("Document not found");
  }

  const doc = await prisma.employeeDocument.update({
    where: { id: docId },
    data: {
      documentName: input.documentName,
      type: input.type,
      startDate: input.startDate === undefined ? undefined : input.startDate ? new Date(input.startDate) : null,
      expiryDate: input.expiryDate === undefined ? undefined : input.expiryDate ? new Date(input.expiryDate) : null,
      status: input.status,
    },
  });

  return toEmployeeDocumentDto(doc);
}

export async function deleteEmployeeDocument(
  prisma: PrismaClient,
  employeeId: number,
  docId: number
): Promise<void> {
  const existing = await prisma.employeeDocument.findFirst({ where: { id: docId, employeeId } });
  if (!existing) {
    throw ApiError.notFound("Document not found");
  }

  if (existing.documentFileKey) {
    await getStorageDriver().delete(existing.documentFileKey).catch(() => undefined);
  }

  await prisma.employeeDocument.delete({ where: { id: docId } });
}
