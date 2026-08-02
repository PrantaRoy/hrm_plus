import { z } from "zod";

export const createLocationSchema = z.object({
  name: z.string().trim().min(1),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().int().min(1),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().trim().min(1).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusMeters: z.coerce.number().int().min(1).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
