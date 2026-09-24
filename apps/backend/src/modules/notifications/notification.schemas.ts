import { z } from "zod";
import { NOTIFICATION_STATUSES } from "@hrm-plus/shared";

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(NOTIFICATION_STATUSES).optional(),
});
