import { RequestHandler } from "express";
import {
  cancelMeetingSchema,
  checkAvailabilitySchema,
  confirmMeetingSchema,
  createMeetingSchema,
  listMeetingsQuerySchema,
  listMyMeetingsQuerySchema,
  respondToMeetingSchema,
  updateMeetingSchema,
} from "./meeting.schemas";
import * as meetingService from "./meeting.service";

export const checkAvailabilityHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await meetingService.resolveEmployeeForUser(req.prisma!, req.user!.id);
    const input = checkAvailabilitySchema.parse(req.body);
    res.json(
      await meetingService.previewAvailability(req.prisma!, {
        ...input,
        fallbackOrganizerEmployeeId: employee.id,
      })
    );
  } catch (err) {
    next(err);
  }
};

export const createMeetingHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await meetingService.resolveEmployeeForUser(req.prisma!, req.user!.id);
    const input = createMeetingSchema.parse(req.body);
    res.status(201).json(await meetingService.createMeeting(req.prisma!, employee.id, input, req.user!));
  } catch (err) {
    next(err);
  }
};

export const listMyMeetingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await meetingService.resolveEmployeeForUser(req.prisma!, req.user!.id);
    const query = listMyMeetingsQuerySchema.parse(req.query);
    res.json(await meetingService.listMyMeetings(req.prisma!, employee.id, query));
  } catch (err) {
    next(err);
  }
};

export const listMeetingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listMeetingsQuerySchema.parse(req.query);
    const actingEmployee = await req.prisma!.employee.findUnique({ where: { userId: req.user!.id } });
    res.json(await meetingService.listMeetings(req.prisma!, query, actingEmployee?.id ?? null));
  } catch (err) {
    next(err);
  }
};

export const getMeetingHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await meetingService.getMeetingById(req.prisma!, Number(req.params.id), req.user!));
  } catch (err) {
    next(err);
  }
};

export const updateMeetingHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateMeetingSchema.parse(req.body);
    res.json(await meetingService.updateMeeting(req.prisma!, Number(req.params.id), req.user!, input));
  } catch (err) {
    next(err);
  }
};

export const confirmMeetingHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = confirmMeetingSchema.parse(req.body ?? {});
    res.json(
      await meetingService.confirmMeeting(
        req.prisma!,
        Number(req.params.id),
        req.user!,
        input.acknowledgeWarnings
      )
    );
  } catch (err) {
    next(err);
  }
};

export const cancelMeetingHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = cancelMeetingSchema.parse(req.body ?? {});
    res.json(
      await meetingService.cancelMeeting(req.prisma!, Number(req.params.id), req.user!, input.cancelReason)
    );
  } catch (err) {
    next(err);
  }
};

export const respondToMeetingHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await meetingService.resolveEmployeeForUser(req.prisma!, req.user!.id);
    const input = respondToMeetingSchema.parse(req.body);
    res.json(
      await meetingService.respondToMeeting(
        req.prisma!,
        Number(req.params.id),
        req.user!,
        employee.id,
        input.response
      )
    );
  } catch (err) {
    next(err);
  }
};
