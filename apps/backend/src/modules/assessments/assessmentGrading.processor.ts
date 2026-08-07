import { PrismaClient } from "../../../generated/tenant";
import { gradeShortTextAnswer } from "../llm/shortTextGrading";
import { finalizeInvitationIfComplete } from "./assessment.service";

/**
 * Worker-invoked (no HTTP layer). Idempotent — a re-delivered job for an
 * already-graded answer is a no-op. On LLM failure, marks the answer FAILED and
 * rethrows so BullMQ retries; once retries are exhausted the answer stays FAILED
 * permanently (counts as 0 points, doesn't block finalizeInvitationIfComplete).
 */
export async function gradeAssessmentAnswer(prisma: PrismaClient, answerId: number): Promise<void> {
  const answer = await prisma.assessmentAnswer.findUnique({ where: { id: answerId }, include: { question: true } });
  if (!answer || answer.gradingStatus === "GRADED") {
    return;
  }

  try {
    const result = await gradeShortTextAnswer({
      questionPrompt: answer.question.prompt,
      answerText: answer.textAnswer,
      maxPoints: answer.question.points,
    });

    await prisma.assessmentAnswer.update({
      where: { id: answerId },
      data: {
        pointsAwarded: result.pointsAwarded,
        aiFeedback: result.feedback,
        gradingStatus: "GRADED",
        gradedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.assessmentAnswer.update({ where: { id: answerId }, data: { gradingStatus: "FAILED" } });
    throw err;
  }

  await finalizeInvitationIfComplete(prisma, answer.invitationId);
}
