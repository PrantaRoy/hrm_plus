import { z } from "zod";
import { CLIENT_PRIORITIES } from "@hrm-plus/shared";

const clientFields = {
  name: z.string().trim().min(1).max(191),
  email: z.string().trim().toLowerCase().email().max(191),
  companyName: z.string().trim().max(191).nullable().optional(),
  phoneNumber: z.string().trim().max(50).nullable().optional(),
  address: z.string().trim().min(1).max(5000),
  tag: z.string().trim().min(1).max(100),
  priority: z.enum(CLIENT_PRIORITIES),
  isActive: z.boolean().optional(),
};

export const createClientSchema = z.object(clientFields);

export const updateClientSchema = z
  .object(clientFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(191).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const clientIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
