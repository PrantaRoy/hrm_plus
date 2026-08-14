import { Prisma } from "../../../generated/tenant";
import { AssetAssignmentDto, AssetDto } from "@hrm-plus/shared";

const assetAssignmentWithRelations = Prisma.validator<Prisma.AssetAssignmentDefaultArgs>()({
  include: {
    employee: { select: { firstName: true, lastName: true } },
    assignedBy: { select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } } },
    returnedTo: { select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } } },
  },
});
export type AssetAssignmentWithRelations = Prisma.AssetAssignmentGetPayload<typeof assetAssignmentWithRelations>;
export const assetAssignmentInclude = assetAssignmentWithRelations.include;

function userDisplayName(
  user: { email: string; employee: { firstName: string; lastName: string } | null } | null
): string | null {
  if (!user) return null;
  return user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email;
}

export function toAssetAssignmentDto(assignment: AssetAssignmentWithRelations): AssetAssignmentDto {
  return {
    id: assignment.id,
    assetId: assignment.assetId,
    employeeId: assignment.employeeId,
    employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
    assignedAt: assignment.assignedAt.toISOString(),
    assignedById: assignment.assignedById,
    assignedByName: userDisplayName(assignment.assignedBy) ?? assignment.assignedBy.email,
    expectedReturnDate: assignment.expectedReturnDate ? assignment.expectedReturnDate.toISOString() : null,
    returnedAt: assignment.returnedAt ? assignment.returnedAt.toISOString() : null,
    returnedToId: assignment.returnedToId,
    returnedToName: userDisplayName(assignment.returnedTo),
    conditionOnAssign: assignment.conditionOnAssign,
    conditionOnReturn: assignment.conditionOnReturn,
    assignReceiptRequestId: assignment.assignReceiptRequestId,
    returnReceiptRequestId: assignment.returnReceiptRequestId,
  };
}

const assetWithRelations = Prisma.validator<Prisma.AssetDefaultArgs>()({
  include: {
    currentAssignment: assetAssignmentWithRelations,
  },
});
export type AssetWithRelations = Prisma.AssetGetPayload<typeof assetWithRelations>;
export const assetInclude = assetWithRelations.include;

export function toAssetDto(asset: AssetWithRelations): AssetDto {
  return {
    id: asset.id,
    assetTag: asset.assetTag,
    name: asset.name,
    category: asset.category as AssetDto["category"],
    status: asset.status as AssetDto["status"],
    serialNumber: asset.serialNumber,
    purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString() : null,
    purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null,
    supplier: asset.supplier,
    notes: asset.notes,
    registrationNumber: asset.registrationNumber,
    registrationExpiry: asset.registrationExpiry ? asset.registrationExpiry.toISOString() : null,
    wofCofExpiry: asset.wofCofExpiry ? asset.wofCofExpiry.toISOString() : null,
    make: asset.make,
    model: asset.model,
    vin: asset.vin,
    testAndTagExpiry: asset.testAndTagExpiry ? asset.testAndTagExpiry.toISOString() : null,
    warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString() : null,
    isFbtRelevant: asset.isFbtRelevant,
    fbtNotes: asset.fbtNotes,
    photoUrl: asset.photoUrl,
    currentAssignment: asset.currentAssignment ? toAssetAssignmentDto(asset.currentAssignment) : null,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}
