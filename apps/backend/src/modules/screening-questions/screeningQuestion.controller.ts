import { RequestHandler } from "express";
import {
  createScreeningQuestionSchema,
  listScreeningQuestionsQuerySchema,
  updateScreeningQuestionSchema,
} from "./screeningQuestion.schemas";
import * as screeningQuestionService from "./screeningQuestion.service";
import { ApiError } from "../../utils/ApiError";

export const listScreeningQuestionsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listScreeningQuestionsQuerySchema.parse(req.query);
    res.json(await screeningQuestionService.listScreeningQuestions(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getScreeningQuestionHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid screening question id");
    res.json(await screeningQuestionService.getScreeningQuestionById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const createScreeningQuestionHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createScreeningQuestionSchema.parse(req.body);
    res.status(201).json(await screeningQuestionService.createScreeningQuestion(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateScreeningQuestionHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid screening question id");
    const input = updateScreeningQuestionSchema.parse(req.body);
    res.json(await screeningQuestionService.updateScreeningQuestion(req.prisma!, id, input));
  } catch (err) {
    next(err);
  }
};

export const deleteScreeningQuestionHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid screening question id");
    await screeningQuestionService.deleteScreeningQuestion(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const seedLegalComplianceQuestionsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await screeningQuestionService.seedLegalComplianceQuestions(req.prisma!));
  } catch (err) {
    next(err);
  }
};
