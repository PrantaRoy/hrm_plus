import { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";

// Passwordless candidate auth: the token is issued via CandidateAccessToken (see
// modules/candidate-portal), emailed to the candidate, and sent back on every
// request as X-Candidate-Token. Unlike PasswordResetToken this token is multi-use
// (a candidate revisits the portal repeatedly) — see the plan's open decision #1.
export const requireCandidateToken: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("X-Candidate-Token");
    if (!token) {
      throw ApiError.unauthorized("Missing candidate token");
    }

    const record = await req.prisma!.candidateAccessToken.findUnique({
      where: { token },
      include: { application: true },
    });

    if (!record || record.expiresAt < new Date()) {
      throw ApiError.unauthorized("This link is invalid or has expired");
    }

    await req.prisma!.candidateAccessToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    req.candidateApplication = {
      applicationId: record.applicationId,
      candidateId: record.application.candidateId,
    };
    next();
  } catch (err) {
    next(err);
  }
};
