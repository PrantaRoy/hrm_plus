import { PROJECT_CODE_PATTERN, deriveProjectCodeBase, generateUniqueProjectCode } from "../../modules/projects/projectCode";

describe("deriveProjectCodeBase", () => {
  it.each([
    ["HRM Plus", "hrm"],
    ["Website Redesign", "website"],
    ["  leading spaces project", "leading"],
    ["Extraordinarily long", "extraor"], // capped at 7
    ["A", "prj"], // too short
    ["!!", "prj"], // nothing usable
    ["", "prj"],
    ["R&D Lab", "rd"],
    ["2026 Launch", "2026"],
  ])("%j -> %j", (title, expected) => {
    expect(deriveProjectCodeBase(title)).toBe(expected);
  });

  it("always yields a code matching the allowed pattern", () => {
    for (const title of ["HRM Plus", "A", "!!", "Extraordinarily long", "R&D"]) {
      expect(deriveProjectCodeBase(title)).toMatch(PROJECT_CODE_PATTERN);
    }
  });
});

describe("generateUniqueProjectCode", () => {
  const dbWithTaken = (taken: string[]) =>
    ({ project: { findUnique: jest.fn(async ({ where }: { where: { code: string } }) => (taken.includes(where.code) ? { id: 1 } : null)) } }) as never;

  it("returns the base when it is free", async () => {
    await expect(generateUniqueProjectCode(dbWithTaken([]), "HRM Plus")).resolves.toBe("hrm");
  });

  it("counts upward from 2 until a free code is found", async () => {
    await expect(generateUniqueProjectCode(dbWithTaken(["hrm"]), "HRM Plus")).resolves.toBe("hrm2");
    await expect(generateUniqueProjectCode(dbWithTaken(["hrm", "hrm2", "hrm3"]), "HRM Plus")).resolves.toBe("hrm4");
  });

  it("gives up after 999 attempts", async () => {
    const db = { project: { findUnique: jest.fn().mockResolvedValue({ id: 1 }) } } as never;
    await expect(generateUniqueProjectCode(db, "HRM Plus")).rejects.toThrow("Could not generate a unique project code");
  });
});
