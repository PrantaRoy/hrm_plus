import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import {
  getUnreadCountHandler,
  listNotificationsHandler,
  markAllReadHandler,
  markReadHandler,
} from "./notification.controller";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", listNotificationsHandler);
notificationRouter.get("/unread-count", getUnreadCountHandler);
notificationRouter.patch("/read-all", markAllReadHandler);
notificationRouter.patch("/:id/read", markReadHandler);
