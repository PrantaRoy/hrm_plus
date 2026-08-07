export const ASSESSMENT_QUESTION_TYPES = ["MCQ", "SHORT_TEXT"] as const;
export type AssessmentQuestionType = (typeof ASSESSMENT_QUESTION_TYPES)[number];

export const ASSESSMENT_STATUSES = ["Draft", "Published"] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const ASSESSMENT_GENERATION_SOURCES = ["MANUAL", "AI_GENERATED", "AI_GENERATED_EDITED"] as const;
export type AssessmentGenerationSource = (typeof ASSESSMENT_GENERATION_SOURCES)[number];

export const ASSESSMENT_INVITATION_STATUSES = ["INVITED", "IN_PROGRESS", "SUBMITTED", "GRADING", "GRADED"] as const;
export type AssessmentInvitationStatus = (typeof ASSESSMENT_INVITATION_STATUSES)[number];

export const ASSESSMENT_OUTCOMES = ["PASSED", "PASSED_PENDING_REVIEW", "FAILED"] as const;
export type AssessmentOutcome = (typeof ASSESSMENT_OUTCOMES)[number];

export const GRADING_STATUSES = ["PENDING", "INSTANT", "QUEUED", "GRADED", "FAILED"] as const;
export type GradingStatus = (typeof GRADING_STATUSES)[number];

export interface AssessmentQuestionDto {
  id: number;
  type: AssessmentQuestionType;
  prompt: string;
  options: string[] | null;
  correctOptionIndex: number | null;
  points: number;
  sortOrder: number;
}

export interface AssessmentDto {
  id: number;
  jobId: number;
  title: string;
  instructions: string | null;
  passThresholdPercent: number;
  generationSource: AssessmentGenerationSource;
  status: AssessmentStatus;
  questions: AssessmentQuestionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertAssessmentQuestionInput {
  type: AssessmentQuestionType;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  points: number;
  sortOrder?: number;
}

export interface CreateOrUpdateAssessmentInput {
  title?: string;
  instructions?: string;
  passThresholdPercent?: number;
  questions: UpsertAssessmentQuestionInput[];
}

export interface GenerateAssessmentWithAiInput {
  mcqCount: number;
  shortTextCount: number;
  passThresholdPercent?: number;
}

export interface AssessmentAnswerResultDto {
  questionId: number;
  type: AssessmentQuestionType;
  prompt: string;
  selectedOptionIndex: number | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  points: number;
  gradingStatus: GradingStatus;
  aiFeedback: string | null;
}

export interface AssessmentInvitationDto {
  id: number;
  applicationId: number;
  assessmentId: number;
  status: AssessmentInvitationStatus;
  totalPoints: number | null;
  scoredPoints: number | null;
  scorePercent: number | null;
  outcome: AssessmentOutcome | null;
  invitedAt: string;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  answers: AssessmentAnswerResultDto[];
}

// Candidate-facing: questions WITHOUT correctOptionIndex
export interface PublicAssessmentQuestionDto {
  id: number;
  type: AssessmentQuestionType;
  prompt: string;
  options: string[] | null;
  points: number;
}

export interface PublicAssessmentDto {
  title: string;
  instructions: string | null;
  status: AssessmentInvitationStatus;
  questions: PublicAssessmentQuestionDto[];
}

export interface SubmitAssessmentAnswersInput {
  answers: Array<{ questionId: number; selectedOptionIndex?: number; textAnswer?: string }>;
}
