import { Prisma } from "../../../generated/tenant";
import { ScreeningQuestionDto } from "@hrm-plus/shared";

const screeningQuestionWithRelations = Prisma.validator<Prisma.ScreeningQuestionDefaultArgs>()({});

export type ScreeningQuestionWithRelations = Prisma.ScreeningQuestionGetPayload<typeof screeningQuestionWithRelations>;

export function toScreeningQuestionDto(question: ScreeningQuestionWithRelations): ScreeningQuestionDto {
  return {
    id: question.id,
    code: question.code,
    text: question.text,
    type: question.type as ScreeningQuestionDto["type"],
    options: (question.options as string[] | null) ?? null,
    category: question.category as ScreeningQuestionDto["category"],
    isSystem: question.isSystem,
    status: question.status as ScreeningQuestionDto["status"],
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };
}
