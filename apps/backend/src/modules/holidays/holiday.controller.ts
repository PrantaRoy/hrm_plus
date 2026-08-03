import { RequestHandler } from "express";
import {
  calendarQuerySchema,
  createHolidaySchema,
  importHolidaysSchema,
  listHolidaysQuerySchema,
  publishYearSchema,
  updateHolidaySchema,
} from "./holiday.schemas";
import * as holidayService from "./holiday.service";
import { ApiError } from "../../utils/ApiError";

export const listHolidaysHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listHolidaysQuerySchema.parse(req.query);
    res.json(await holidayService.listHolidays(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getCalendarHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = calendarQuerySchema.parse(req.query);
    res.json(await holidayService.getCalendar(req.prisma!, query.startDate, query.endDate));
  } catch (err) {
    next(err);
  }
};

export const getHolidayHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid holiday id");
    res.json(await holidayService.getHolidayById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const createHolidayHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createHolidaySchema.parse(req.body);
    res.status(201).json(await holidayService.createHoliday(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateHolidayHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid holiday id");
    const input = updateHolidaySchema.parse(req.body);
    res.json(await holidayService.updateHoliday(req.prisma!, id, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const deleteHolidayHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid holiday id");
    await holidayService.deleteHoliday(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const publishHolidayHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid holiday id");
    res.json(await holidayService.publishHoliday(req.prisma!, id, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const unpublishHolidayHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid holiday id");
    res.json(await holidayService.unpublishHoliday(req.prisma!, id, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const publishYearHandler: RequestHandler = async (req, res, next) => {
  try {
    const { year } = publishYearSchema.parse(req.body);
    res.json(await holidayService.publishYear(req.prisma!, year, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const importHolidaysHandler: RequestHandler = async (req, res, next) => {
  try {
    const { country, year } = importHolidaysSchema.parse(req.body);
    res.json(await holidayService.importHolidays(req.prisma!, country, year, req.user!.id));
  } catch (err) {
    next(err);
  }
};
