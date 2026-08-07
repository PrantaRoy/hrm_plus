import { RequestHandler } from "express";
import { createOrUpdateAssessmentSchema, generateAssessmentWithAiSchema, submitAssessmentAnswersSchema } from "./assessment.schemas";
import * as assessmentService from "./assessment.service";
import { ApiError } from "../../utils/ApiError";

export const getAssessmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) throw ApiError.badRequest("Invalid job id");
    res.json(await assessmentService.getAssessmentByJobId(req.prisma!, jobId));
  } catch (err) {
    next(err);
  }
};

export const upsertAssessmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) throw ApiError.badRequest("Invalid job id");
    const input = createOrUpdateAssessmentSchema.parse(req.body);
    res.json(await assessmentService.upsertAssessment(req.prisma!, jobId, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const generateAssessmentWithAiHandler: RequestHandler = async (req, res, next) => {
  try {
    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) throw ApiError.badRequest("Invalid job id");
    const input = generateAssessmentWithAiSchema.parse(req.body);
    res.json(await assessmentService.generateAssessmentWithAi(req.prisma!, jobId, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const publishAssessmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const jobId = Number(req.params.jobId);
    if (Number.isNaN(jobId)) throw ApiError.badRequest("Invalid job id");
    res.json(await assessmentService.publishAssessment(req.prisma!, jobId, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const resendInviteHandler: RequestHandler = async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    if (Number.isNaN(applicationId)) throw ApiError.badRequest("Invalid application id");
    res.json(await assessmentService.inviteCandidateToAssessment(req.prisma!, applicationId, req.tenant!.slug));
  } catch (err) {
    next(err);
  }
};

export const getAssignedAssessmentHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await assessmentService.getAssignedAssessment(req.prisma!, req.candidateApplication!.applicationId));
  } catch (err) {
    next(err);
  }
};

export const submitAssessmentAnswersHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = submitAssessmentAnswersSchema.parse(req.body);
    res.json(
      await assessmentService.submitAssessmentAnswers(
        req.prisma!,
        req.candidateApplication!.applicationId,
        input,
        req.tenant!.slug
      )
    );
  } catch (err) {
    next(err);
  }
};
