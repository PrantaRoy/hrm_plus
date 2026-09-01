import { z } from "zod";

export const updateSchedulerSettingsSchema = z.object({
  blockOnApprovedLeave: z.boolean().optional(),
  blockOnPendingLeave: z.boolean().optional(),
  blockOnMeetingOverlap: z.boolean().optional(),
  blockOnOutsideShift: z.boolean().optional(),
  blockOnNoRoster: z.boolean().optional(),
  considerApprovedRostersOnly: z.boolean().optional(),
  optionalParticipantsCanBlock: z.boolean().optional(),
});
