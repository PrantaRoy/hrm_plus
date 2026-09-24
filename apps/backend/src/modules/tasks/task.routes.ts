import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { buildAttachmentRouter } from "../attachments/attachment.routes";
import { buildCommentRouter } from "../comments/comment.routes";
import {
  addChecklistItemHandler,
  completeChecklistItemHandler,
  deleteChecklistItemHandler,
  renameChecklistItemHandler,
  verifyChecklistItemHandler,
} from "./checklist.controller";
import {
  createTaskHandler,
  deleteTaskHandler,
  getMyWorkDashboardHandler,
  getTaskHandler,
  listMyTasksHandler,
  listTasksHandler,
  setTaskFollowersHandler,
  setTaskMembersHandler,
  updateTaskHandler,
} from "./task.controller";
import {
  createTimeEntryHandler,
  deleteTimeEntryHandler,
  listTimeEntriesHandler,
  startTimerHandler,
  stopTimerHandler,
  updateTimeEntryHandler,
} from "./timeEntry.controller";

export const taskRouter = Router();

// Role-level gating is intentionally not used here: access is per task (supervisor,
// member, follower, or manager role) and is enforced in the services.
taskRouter.use(requireAuth);

taskRouter.get("/", listTasksHandler);
taskRouter.get("/my", listMyTasksHandler);
// Declared before "/:id" so "dashboard" is not read as a task id.
taskRouter.get("/dashboard", getMyWorkDashboardHandler);
taskRouter.post("/", createTaskHandler);

// Single time entries are addressed without the task id; declared before "/:id".
taskRouter.patch("/time-entries/:entryId", updateTimeEntryHandler);
taskRouter.delete("/time-entries/:entryId", deleteTimeEntryHandler);

taskRouter.get("/:id", getTaskHandler);
taskRouter.patch("/:id", updateTaskHandler);
taskRouter.delete("/:id", deleteTaskHandler);
taskRouter.put("/:id/members", setTaskMembersHandler);
taskRouter.put("/:id/followers", setTaskFollowersHandler);

taskRouter.post("/:id/checklists", addChecklistItemHandler);
taskRouter.patch("/:id/checklists/:cid", renameChecklistItemHandler);
taskRouter.delete("/:id/checklists/:cid", deleteChecklistItemHandler);
taskRouter.post("/:id/checklists/:cid/complete", completeChecklistItemHandler);
taskRouter.post("/:id/checklists/:cid/verify", verifyChecklistItemHandler);

taskRouter.get("/:id/time-entries", listTimeEntriesHandler);
taskRouter.post("/:id/time-entries", createTimeEntryHandler);
taskRouter.post("/:id/time-entries/start", startTimerHandler);
taskRouter.post("/:id/time-entries/stop", stopTimerHandler);

taskRouter.use("/:id/comments", buildCommentRouter("task"));
taskRouter.use("/:id/attachments", buildAttachmentRouter("task"));
