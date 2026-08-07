import { RequestHandler } from "express";
import { listApplicationsQuerySchema, submitApplicationSchema } from "./application.schemas";
import * as applicationService from "./application.service";
import { ApiError } from "../../utils/ApiError";

export const submitApplicationHandler: RequestHandler = async (req, res, next) => {
  try {
    const rawBody = { ...req.body };
    if (typeof rawBody.answers === "string") {
      try {
        rawBody.answers = JSON.parse(rawBody.answers);
      } catch {
        throw ApiError.badRequest("answers must be valid JSON");
      }
    }
    const input = submitApplicationSchema.parse(rawBody);

    const file = req.file
      ? { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype }
      : undefined;

    const application = await applicationService.submitApplication(
      req.prisma!,
      req.params.jobSlug,
      input,
      file,
      req.tenant!.slug
    );
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
};

export const listApplicationsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listApplicationsQuerySchema.parse(req.query);
    res.json(await applicationService.listApplications(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getApplicationHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid application id");
    res.json(await applicationService.getApplicationById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};
