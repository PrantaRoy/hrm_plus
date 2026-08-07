import { PrismaClient, Prisma } from "../../../generated/tenant";
import {
  CreateScreeningQuestionInput,
  ListScreeningQuestionsQuery,
  ScreeningQuestionDto,
  SeedLegalComplianceQuestionsResult,
  UpdateScreeningQuestionInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toScreeningQuestionDto } from "./screeningQuestion.mapper";
import { SCREENING_QUESTION_SEEDS } from "./screeningQuestion.seedData";

function assertOptionsValid(type: string, options?: string[]) {
  const needsOptions = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
  if (needsOptions && (!options || options.length < 2)) {
    throw ApiError.badRequest("SINGLE_CHOICE and MULTIPLE_CHOICE questions require at least 2 options");
  }
}

export async function listScreeningQuestions(
  prisma: PrismaClient,
  query: ListScreeningQuestionsQuery
): Promise<ScreeningQuestionDto[]> {
  const where: Prisma.ScreeningQuestionWhereInput = {
    ...(query.category ? { category: query.category } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const questions = await prisma.screeningQuestion.findMany({ where, orderBy: { createdAt: "desc" } });
  return questions.map(toScreeningQuestionDto);
}

export async function getScreeningQuestionById(prisma: PrismaClient, id: number): Promise<ScreeningQuestionDto> {
  const question = await prisma.screeningQuestion.findUnique({ where: { id } });
  if (!question) {
    throw ApiError.notFound("Screening question not found");
  }
  return toScreeningQuestionDto(question);
}

export async function createScreeningQuestion(
  prisma: PrismaClient,
  input: CreateScreeningQuestionInput,
  createdById: number
): Promise<ScreeningQuestionDto> {
  assertOptionsValid(input.type, input.options);
  const question = await prisma.screeningQuestion.create({
    data: {
      text: input.text,
      type: input.type,
      options: input.options ?? undefined,
      category: "Custom",
      createdById,
    },
  });
  return toScreeningQuestionDto(question);
}

export async function updateScreeningQuestion(
  prisma: PrismaClient,
  id: number,
  input: UpdateScreeningQuestionInput
): Promise<ScreeningQuestionDto> {
  const existing = await prisma.screeningQuestion.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Screening question not found");
  }
  assertOptionsValid(input.type ?? existing.type, input.options ?? (existing.options as string[] | null) ?? undefined);

  const question = await prisma.screeningQuestion.update({
    where: { id },
    data: {
      text: input.text,
      type: input.type,
      options: input.options,
      status: input.status,
    },
  });
  return toScreeningQuestionDto(question);
}

export async function deleteScreeningQuestion(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.screeningQuestion.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Screening question not found");
  }
  if (existing.isSystem) {
    throw ApiError.conflict("System-provided compliance questions cannot be deleted, only deactivated");
  }
  const jobLinkCount = await prisma.jobScreeningQuestion.count({ where: { questionId: id } });
  if (jobLinkCount > 0) {
    throw ApiError.conflict("This question is attached to one or more jobs and cannot be deleted");
  }
  await prisma.screeningQuestion.delete({ where: { id } });
}

export async function seedLegalComplianceQuestions(prisma: PrismaClient): Promise<SeedLegalComplianceQuestionsResult> {
  let created = 0;
  let skipped = 0;
  const questions: ScreeningQuestionDto[] = [];

  for (const seed of SCREENING_QUESTION_SEEDS) {
    const existing = await prisma.screeningQuestion.findUnique({ where: { code: seed.code } });
    if (existing) {
      skipped += 1;
      questions.push(toScreeningQuestionDto(existing));
      continue;
    }
    const question = await prisma.screeningQuestion.create({
      data: {
        code: seed.code,
        text: seed.text,
        type: seed.type,
        options: seed.options ?? undefined,
        category: seed.category,
        isSystem: true,
      },
    });
    created += 1;
    questions.push(toScreeningQuestionDto(question));
  }

  return { created, skipped, questions };
}
