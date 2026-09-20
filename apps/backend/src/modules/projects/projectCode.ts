import { Prisma, PrismaClient } from "../../../generated/tenant";

type Db = PrismaClient | Prisma.TransactionClient;

export const PROJECT_CODE_PATTERN = /^[a-z0-9]{2,10}$/;

/** "HRM Plus" -> "hrm", "Website Redesign" -> "website", "!!" -> "prj". */
export function deriveProjectCodeBase(title: string): string {
  const firstWord = title.trim().toLowerCase().split(/\s+/)[0] ?? "";
  const cleaned = firstWord.replace(/[^a-z0-9]/g, "").slice(0, 7);
  return cleaned.length >= 2 ? cleaned : "prj";
}

/** Returns `base`, or `base2`, `base3`, ... — whichever is not taken yet. */
export async function generateUniqueProjectCode(db: Db, title: string): Promise<string> {
  const base = deriveProjectCodeBase(title);
  let candidate = base;
  for (let n = 2; n < 1000; n++) {
    const taken = await db.project.findUnique({ where: { code: candidate }, select: { id: true } });
    if (!taken) return candidate;
    candidate = `${base}${n}`;
  }
  throw new Error("Could not generate a unique project code");
}
