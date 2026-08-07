export const SCREENING_QUESTION_TYPES = ["YES_NO", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "SHORT_TEXT"] as const;
export type ScreeningQuestionType = (typeof SCREENING_QUESTION_TYPES)[number];

export const SCREENING_QUESTION_CATEGORIES = ["LegalCompliance", "Custom"] as const;
export type ScreeningQuestionCategory = (typeof SCREENING_QUESTION_CATEGORIES)[number];

export const SCREENING_QUESTION_STATUSES = ["Active", "Inactive"] as const;
export type ScreeningQuestionStatus = (typeof SCREENING_QUESTION_STATUSES)[number];

export interface ScreeningQuestionDto {
  id: number;
  code: string | null;
  text: string;
  type: ScreeningQuestionType;
  options: string[] | null;
  category: ScreeningQuestionCategory;
  isSystem: boolean;
  status: ScreeningQuestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScreeningQuestionInput {
  text: string;
  type: ScreeningQuestionType;
  options?: string[];
}

export type UpdateScreeningQuestionInput = Partial<CreateScreeningQuestionInput> & {
  status?: ScreeningQuestionStatus;
};

export interface ListScreeningQuestionsQuery {
  category?: ScreeningQuestionCategory;
  status?: ScreeningQuestionStatus;
}

export interface SeedLegalComplianceQuestionsResult {
  created: number;
  skipped: number;
  questions: ScreeningQuestionDto[];
}
