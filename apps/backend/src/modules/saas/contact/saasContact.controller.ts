import { RequestHandler } from "express";
import { ApiError } from "../../../utils/ApiError";
import {
  listSaasContactQuerySchema,
  submitSaasContactSchema,
  updateSaasContactStatusSchema,
} from "./saasContact.schemas";
import * as service from "./saasContact.service";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest("Invalid contact submission id");
  return id;
}

export const submitSaasContactHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = submitSaasContactSchema.parse(req.body);
    const submission = await service.submitSaasContact(input, req.ip ?? null);
    res.status(201).json(submission);
  } catch (err) {
    next(err);
  }
};

export const listSaasContactHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listSaasContactQuerySchema.parse(req.query);
    res.json(await service.listSaasContactSubmissions(query));
  } catch (err) {
    next(err);
  }
};

export const getSaasContactHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await service.getSaasContactSubmissionById(parseId(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const updateSaasContactStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateSaasContactStatusSchema.parse(req.body);
    res.json(await service.updateSaasContactSubmissionStatus(parseId(req.params.id), input.status));
  } catch (err) {
    next(err);
  }
};

export const deleteSaasContactHandler: RequestHandler = async (req, res, next) => {
  try {
    await service.deleteSaasContactSubmission(parseId(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
