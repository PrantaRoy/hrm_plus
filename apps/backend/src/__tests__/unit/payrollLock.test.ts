import { assertNotPayrollLocked } from "../../modules/payroll/payrollLock";

describe("assertNotPayrollLocked", () => {
  const prismaReturning = (row: unknown) => ({ workReport: { findFirst: jest.fn().mockResolvedValue(row) } });

  it("passes when no approved/processed report covers the date", async () => {
    await expect(assertNotPayrollLocked(prismaReturning(null) as never, 1, new Date())).resolves.toBeUndefined();
  });

  it("queries only HR_APPROVED/PAYROLL_PROCESSED reports whose period contains the UTC calendar day", async () => {
    const prisma = prismaReturning(null);
    await assertNotPayrollLocked(prisma as never, 42, new Date("2026-03-10T17:45:00Z"));
    expect(prisma.workReport.findFirst).toHaveBeenCalledWith({
      where: {
        employeeId: 42,
        status: { in: ["HR_APPROVED", "PAYROLL_PROCESSED"] },
        periodStart: { lte: new Date("2026-03-10T00:00:00Z") },
        periodEnd: { gte: new Date("2026-03-10T00:00:00Z") },
      },
    });
  });

  it("throws a 409 naming the locking report", async () => {
    await expect(assertNotPayrollLocked(prismaReturning({ id: 7, status: "HR_APPROVED" }) as never, 1, new Date())).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining("#7, HR_APPROVED"),
    });
  });
});
