import { RequestHandler } from "express";
import { calendarQuerySchema, trendsQuerySchema } from "./dashboard.schemas";
import * as dashboardService from "./dashboard.service";
import { addMinutes, toDateOnlyUTC } from "../../utils/date";

export const getSummaryHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await dashboardService.getSummary(req.prisma!, req.user!));
  } catch (err) {
    next(err);
  }
};

export const getTrendsHandler: RequestHandler = async (req, res, next) => {
  try {
    const { days } = trendsQuerySchema.parse(req.query);
    const endDate = toDateOnlyUTC(new Date());
    const startDate = addMinutes(endDate, -(days - 1) * 24 * 60);
    res.json(await dashboardService.getTrends(req.prisma!, startDate, endDate));
  } catch (err) {
    next(err);
  }
};

export const getCalendarHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = calendarQuerySchema.parse(req.query);
    res.json(
      await dashboardService.getCalendar(
        req.prisma!,
        toDateOnlyUTC(new Date(query.startDate)),
        toDateOnlyUTC(new Date(query.endDate))
      )
    );
  } catch (err) {
    next(err);
  }
};
