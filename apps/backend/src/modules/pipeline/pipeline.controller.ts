import { RequestHandler } from "express";
import { boardQuerySchema, moveApplicationStageSchema } from "./pipeline.schemas";
import * as pipelineService from "./pipeline.service";
import { ApiError } from "../../utils/ApiError";

export const getBoardHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = boardQuerySchema.parse(req.query);
    res.json(await pipelineService.getBoard(req.prisma!, query.jobId));
  } catch (err) {
    next(err);
  }
};

export const moveApplicationStageHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid application id");
    const input = moveApplicationStageSchema.parse(req.body);
    res.json(
      await pipelineService.moveApplicationStage(req.prisma!, id, input.toStage, req.user!.id, {
        note: input.note,
        rejectionReason: input.rejectionReason,
        tenantSlug: req.tenant!.slug,
      })
    );
  } catch (err) {
    next(err);
  }
};
