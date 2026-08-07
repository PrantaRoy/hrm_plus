import { PrismaClient, Candidate } from "../../../generated/tenant";

export interface FindOrCreateCandidateInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export async function findOrCreateCandidate(prisma: PrismaClient, input: FindOrCreateCandidateInput): Promise<Candidate> {
  return prisma.candidate.upsert({
    where: { email: input.email },
    update: { fullName: input.fullName, phoneNumber: input.phoneNumber },
    create: { fullName: input.fullName, email: input.email, phoneNumber: input.phoneNumber },
  });
}
