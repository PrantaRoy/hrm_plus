import { RequestHandler } from "express";
import { AttachableType } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { resolveActor } from "../projects/projectAccess";
import { attachmentIdParamSchema, ownerIdParamSchema } from "./attachment.schemas";
import * as attachmentService from "./attachment.service";

export function listAttachmentsHandler(type: AttachableType): RequestHandler {
  return async (req, res, next) => {
    try {
      const { id } = ownerIdParamSchema.parse(req.params);
      const actor = await resolveActor(req.prisma!, req.user!);
      res.json(await attachmentService.listAttachments(req.prisma!, actor, type, id));
    } catch (err) {
      next(err);
    }
  };
}

export function uploadAttachmentHandler(type: AttachableType): RequestHandler {
  return async (req, res, next) => {
    try {
      const { id } = ownerIdParamSchema.parse(req.params);
      if (!req.file) throw ApiError.badRequest("A file is required (multipart field: file)");
      const actor = await resolveActor(req.prisma!, req.user!);
      const attachment = await attachmentService.uploadAttachment(req.prisma!, actor, type, id, {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
      res.status(201).json(attachment);
    } catch (err) {
      next(err);
    }
  };
}

export const deleteAttachmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { attachmentId } = attachmentIdParamSchema.parse(req.params);
    const actor = await resolveActor(req.prisma!, req.user!);
    await attachmentService.deleteAttachment(req.prisma!, actor, attachmentId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
