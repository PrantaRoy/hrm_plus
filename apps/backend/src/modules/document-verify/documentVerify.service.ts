import { PrismaClient } from "../../../generated/tenant";
import { PublicDocumentVerificationDto } from "@hrm-plus/shared";

/**
 * Deliberately minimal: no salary figures, no template content, no employee id.
 * An unknown reference number resolves to the same { valid: false } shape as an
 * invalidated one, rather than a distinguishable 404 — a verifier learns "valid" or
 * "not valid", nothing about whether the reference number itself ever existed.
 */
export async function verifyDocumentReference(
  prisma: PrismaClient,
  referenceNumber: string
): Promise<PublicDocumentVerificationDto> {
  const request = await prisma.documentRequest.findUnique({
    where: { referenceNumber },
    include: { employee: true, template: { include: { category: true } } },
  });

  if (!request || request.status !== "Issued") {
    return { valid: false, referenceNumber, documentTypeName: null, issuedToName: null, issuedAt: null };
  }

  return {
    valid: true,
    referenceNumber,
    documentTypeName: request.template.category.name,
    issuedToName: `${request.employee.firstName} ${request.employee.lastName}`,
    issuedAt: request.issuedAt ? request.issuedAt.toISOString() : null,
  };
}
