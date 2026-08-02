import { RequestHandler } from "express";
import { createIpRuleSchema, updateIpRuleSchema } from "./ipRule.schemas";
import * as ipRuleService from "./ipRule.service";

export const listIpRulesHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await ipRuleService.listIpRules(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const createIpRuleHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createIpRuleSchema.parse(req.body);
    res.status(201).json(await ipRuleService.createIpRule(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateIpRuleHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateIpRuleSchema.parse(req.body);
    res.json(await ipRuleService.updateIpRule(req.prisma!, Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
};

export const deleteIpRuleHandler: RequestHandler = async (req, res, next) => {
  try {
    await ipRuleService.deleteIpRule(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
