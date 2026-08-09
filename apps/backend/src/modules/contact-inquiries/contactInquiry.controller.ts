import { RequestHandler } from "express";
import {
  listContactInquiriesQuerySchema,
  submitContactInquirySchema,
  updateContactInquiryStatusSchema,
} from "./contactInquiry.schemas";
import * as contactInquiryService from "./contactInquiry.service";
import { ApiError } from "../../utils/ApiError";

export const submitContactInquiryHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = submitContactInquirySchema.parse(req.body);
    const inquiry = await contactInquiryService.submitContactInquiry(req.prisma!, input, req.ip ?? null);
    res.status(201).json(inquiry);
  } catch (err) {
    next(err);
  }
};

export const listContactInquiriesHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listContactInquiriesQuerySchema.parse(req.query);
    res.json(await contactInquiryService.listContactInquiries(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getContactInquiryHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid contact inquiry id");
    res.json(await contactInquiryService.getContactInquiryById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const updateContactInquiryStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid contact inquiry id");
    const input = updateContactInquiryStatusSchema.parse(req.body);
    res.json(await contactInquiryService.updateContactInquiryStatus(req.prisma!, id, input.status));
  } catch (err) {
    next(err);
  }
};

export const deleteContactInquiryHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid contact inquiry id");
    await contactInquiryService.deleteContactInquiry(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
