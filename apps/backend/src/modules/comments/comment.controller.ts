import { RequestHandler } from "express";
import { CommentableType } from "@hrm-plus/shared";
import { resolveActor } from "../projects/projectAccess";
import {
  commentIdParamSchema,
  createCommentSchema,
  ownerIdParamSchema,
  updateCommentSchema,
} from "./comment.schemas";
import * as commentService from "./comment.service";

export function listCommentsHandler(type: CommentableType): RequestHandler {
  return async (req, res, next) => {
    try {
      const { id } = ownerIdParamSchema.parse(req.params);
      const actor = await resolveActor(req.prisma!, req.user!);
      res.json(await commentService.listComments(req.prisma!, actor, type, id));
    } catch (err) {
      next(err);
    }
  };
}

export function createCommentHandler(type: CommentableType): RequestHandler {
  return async (req, res, next) => {
    try {
      const { id } = ownerIdParamSchema.parse(req.params);
      const input = createCommentSchema.parse(req.body);
      const actor = await resolveActor(req.prisma!, req.user!);
      res.status(201).json(await commentService.createComment(req.prisma!, actor, type, id, input));
    } catch (err) {
      next(err);
    }
  };
}

export const updateCommentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { commentId } = commentIdParamSchema.parse(req.params);
    const input = updateCommentSchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await commentService.updateComment(req.prisma!, actor, commentId, input));
  } catch (err) {
    next(err);
  }
};

export const deleteCommentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { commentId } = commentIdParamSchema.parse(req.params);
    const actor = await resolveActor(req.prisma!, req.user!);
    await commentService.deleteComment(req.prisma!, actor, commentId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
