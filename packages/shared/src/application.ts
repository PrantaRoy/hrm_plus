import { AssessmentInvitationStatus, AssessmentOutcome } from "./assessment";

export const PIPELINE_STAGES = [
  "APPLICATION_RECEIVED",
  "AI_ASSESSMENT",
  "VIRTUAL_INTERVIEW",
  "IN_PERSON_INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface ApplicationAnswerDto {
  jobScreeningQuestionId: number;
  questionText: string;
  answerText: string | null;
  answerOptions: string[] | null;
}

export interface SubmitJobApplicationInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  coverLetter?: string;
  answers: Array<{ jobScreeningQuestionId: number; answerText?: string; answerOptions?: string[] }>;
  // resume file goes as multipart "resume" field, not in this JSON body
}

export interface ApplicationDto {
  id: number;
  jobId: number;
  jobTitle: string;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhoneNumber: string | null;
  resumeFileUrl: string | null;
  coverLetter: string | null;
  stage: PipelineStage;
  movedToStageAt: string;
  withdrawnAt: string | null;
  rejectionReason: string | null;
  assessmentOutcome: AssessmentOutcome | null;
  assessmentInvitationStatus: AssessmentInvitationStatus | null;
  answers: ApplicationAnswerDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineBoardColumnDto {
  stage: PipelineStage;
  applications: ApplicationDto[];
}

export interface PipelineBoardDto {
  jobId: number;
  jobTitle: string;
  columns: PipelineBoardColumnDto[];
}

export interface MoveApplicationStageInput {
  toStage: PipelineStage;
  note?: string;
  rejectionReason?: string;
}

export interface ListApplicationsQuery {
  jobId?: number;
  stage?: PipelineStage;
}

// Candidate-portal-facing (token-authenticated)
export interface CandidatePortalApplicationDto {
  applicationId: number;
  jobTitle: string;
  stage: PipelineStage;
  withdrawnAt: string | null;
  hasAssessmentInvitation: boolean;
  assessmentStatus: AssessmentInvitationStatus | null;
}
