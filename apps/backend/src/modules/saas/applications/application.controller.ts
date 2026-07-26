import { RequestHandler } from "express";
import {
  listApplicationsQuerySchema,
  reviewApplicationSchema,
  submitApplicationSchema,
  updateApplicationSchema,
} from "./application.schemas";
import * as applicationService from "./application.service";
import { approveApplication } from "./approvalService";
import { ApiError } from "../../../utils/ApiError";

export const submitApplicationHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = submitApplicationSchema.parse(req.body);
    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;
    const result = await applicationService.submitApplication(input, logoUrl);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const listApplicationsHandler: RequestHandler = async (req, res, next) => {
  try {
    const { status } = listApplicationsQuerySchema.parse(req.query);
    const result = await applicationService.listApplications(status);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getApplicationHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid application id");
    const result = await applicationService.getApplicationById(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateApplicationHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid application id");
    const input = updateApplicationSchema.parse(req.body);
    const result = await applicationService.updateApplication(id, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const approveApplicationHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid application id");
    const result = await approveApplication(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const rejectApplicationHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid application id");
    const { reviewNote } = reviewApplicationSchema.parse(req.body);
    const result = await applicationService.rejectApplication(id, reviewNote);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
