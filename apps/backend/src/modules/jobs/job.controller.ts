import { RequestHandler } from "express";
import { createJobSchema, listJobsQuerySchema, updateJobSchema } from "./job.schemas";
import * as jobService from "./job.service";
import { toPublicJobListItem } from "./job.mapper";
import { ApiError } from "../../utils/ApiError";

export const listJobsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listJobsQuerySchema.parse(req.query);
    res.json(await jobService.listJobs(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getJobHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid job id");
    res.json(await jobService.getJobById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const getPublicJobHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await jobService.getPublicJobBySlug(req.prisma!, req.params.slug));
  } catch (err) {
    next(err);
  }
};

export const listPublicJobsHandler: RequestHandler = async (req, res, next) => {
  try {
    const jobs = await jobService.listJobs(req.prisma!, { status: "Open" });
    res.json(jobs.map(toPublicJobListItem));
  } catch (err) {
    next(err);
  }
};

export const createJobHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createJobSchema.parse(req.body);
    res.status(201).json(await jobService.createJob(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateJobHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid job id");
    const input = updateJobSchema.parse(req.body);
    res.json(await jobService.updateJob(req.prisma!, id, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const publishJobHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid job id");
    res.json(await jobService.publishJob(req.prisma!, id, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const closeJobHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid job id");
    res.json(await jobService.closeJob(req.prisma!, id, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const deleteJobHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid job id");
    await jobService.deleteJob(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
