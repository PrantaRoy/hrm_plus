import { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError";
import { listNotificationsQuerySchema } from "./notification.schemas";
import * as notificationService from "./notification.service";

export const listNotificationsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listNotificationsQuerySchema.parse(req.query);
    res.json(await notificationService.listNotifications(req.prisma!, req.user!.id, query));
  } catch (err) {
    next(err);
  }
};

export const getUnreadCountHandler: RequestHandler = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.prisma!, req.user!.id);
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

export const markReadHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid notification id");
    res.json(await notificationService.markNotificationRead(req.prisma!, req.user!.id, id));
  } catch (err) {
    next(err);
  }
};

export const markAllReadHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await notificationService.markAllNotificationsRead(req.prisma!, req.user!.id));
  } catch (err) {
    next(err);
  }
};
