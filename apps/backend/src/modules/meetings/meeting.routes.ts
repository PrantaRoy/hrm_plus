import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  cancelMeetingHandler,
  checkAvailabilityHandler,
  confirmMeetingHandler,
  createMeetingHandler,
  getMeetingHandler,
  listMeetingsHandler,
  listMyMeetingsHandler,
  respondToMeetingHandler,
  updateMeetingHandler,
} from "./meeting.controller";

export const meetingRouter = Router();

meetingRouter.use(requireAuth);

meetingRouter.post("/check-availability", checkAvailabilityHandler);
meetingRouter.get("/my", listMyMeetingsHandler);
meetingRouter.get("/", requireRole("Admin", "HR", "Manager"), listMeetingsHandler);
meetingRouter.post("/", createMeetingHandler);
meetingRouter.get("/:id", getMeetingHandler);
meetingRouter.patch("/:id", updateMeetingHandler);
meetingRouter.post("/:id/confirm", confirmMeetingHandler);
meetingRouter.post("/:id/cancel", cancelMeetingHandler);
meetingRouter.post("/:id/respond", respondToMeetingHandler);
