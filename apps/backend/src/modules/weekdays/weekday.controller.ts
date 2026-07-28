import { RequestHandler } from "express";
import { createWeekDaySchema, updateWeekDaySchema } from "./weekday.schemas";
import * as weekDayService from "./weekday.service";

export const listWeekDaysHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await weekDayService.listWeekDays(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const getWeekDayHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await weekDayService.getWeekDayById(req.prisma!, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const createWeekDayHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createWeekDaySchema.parse(req.body);
    res.status(201).json(await weekDayService.createWeekDay(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateWeekDayHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateWeekDaySchema.parse(req.body);
    res.json(await weekDayService.updateWeekDay(req.prisma!, Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
};

export const deleteWeekDayHandler: RequestHandler = async (req, res, next) => {
  try {
    await weekDayService.deleteWeekDay(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
