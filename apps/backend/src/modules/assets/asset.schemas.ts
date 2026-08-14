import { z } from "zod";
import { ASSET_CATEGORIES, ASSET_STATUSES, VEHICLE_ASSET_CATEGORIES } from "@hrm-plus/shared";

const TOOL_CATEGORIES = ["Tool", "OfficeEquipment"];

function isVehicleCategory(category: string): boolean {
  return (VEHICLE_ASSET_CATEGORIES as string[]).includes(category);
}

const baseAssetFields = {
  name: z.string().trim().min(1),
  serialNumber: z.string().trim().min(1).optional(),
  purchaseDate: z.string().min(1).optional(),
  purchaseCost: z.number().min(0).optional(),
  supplier: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
  registrationNumber: z.string().trim().min(1).optional(),
  registrationExpiry: z.string().min(1).optional(),
  wofCofExpiry: z.string().min(1).optional(),
  make: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  vin: z.string().trim().min(1).optional(),
  testAndTagExpiry: z.string().min(1).optional(),
  warrantyExpiry: z.string().min(1).optional(),
  isFbtRelevant: z.boolean().optional(),
  fbtNotes: z.string().trim().min(1).optional(),
};

const VEHICLE_ONLY_FIELDS = [
  "registrationNumber",
  "registrationExpiry",
  "wofCofExpiry",
  "make",
  "model",
  "vin",
] as const;

/**
 * Category-specific fields (vehicle rego/WoF/VIN, tool test-and-tag) may only be set
 * for the matching category. Returns a list of invalid-field error messages, empty if OK.
 * Shared between the create schema's superRefine and the update service (where category
 * is immutable and comes from the existing row, not the request body).
 */
function findInvalidCategoryFields(category: string, data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!isVehicleCategory(category)) {
    for (const field of VEHICLE_ONLY_FIELDS) {
      if (data[field] !== undefined) {
        errors.push(`${field} can only be set when category is a vehicle`);
      }
    }
  }
  if (!TOOL_CATEGORIES.includes(category) && data.testAndTagExpiry !== undefined) {
    errors.push("testAndTagExpiry can only be set when category is Tool or OfficeEquipment");
  }
  return errors;
}

export const createAssetSchema = z
  .object({
    category: z.enum(ASSET_CATEGORIES),
    ...baseAssetFields,
  })
  .superRefine((data, ctx) => {
    for (const message of findInvalidCategoryFields(data.category, data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });

export const updateAssetSchema = z.object(baseAssetFields);

export const assignAssetSchema = z.object({
  employeeId: z.number().int(),
  expectedReturnDate: z.string().min(1).optional(),
  conditionOnAssign: z.string().trim().min(1).optional(),
});

export const returnAssetSchema = z.object({
  conditionOnReturn: z.string().trim().min(1).optional(),
});

export const listAssetsQuerySchema = z.object({
  category: z.enum(ASSET_CATEGORIES).optional(),
  status: z.enum(ASSET_STATUSES).optional(),
  isFbtRelevant: z.coerce.boolean().optional(),
  employeeId: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export { findInvalidCategoryFields };
