import request from "supertest";
import { AiKpiReportDto, TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients, getTenantClient } from "../db/tenantClientPool";
import { PrismaClient } from "../../generated/tenant";
import { ApiError } from "../utils/ApiError";
import { toDateOnlyUTC } from "../utils/date";
import { createTaskWithNumber } from "../modules/tasks/taskNumber.service";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

// The real provider would call a third-party API; tests drive the LLM through this stub instead.
const mockGetLlmProvider = jest.fn();
jest.mock("../modules/llm/llmProvider.factory", () => ({
  getLlmProvider: (...args: unknown[]) => mockGetLlmProvider(...args),
  getLlmProviderInfo: async () => ({ provider: "groq", model: "test-model" }),
}));

const app = createApp();
let tenant: TestTenant;
let adminToken: string;
let staffToken: string;
let tc: PrismaClient;
let adminUserId: number;

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const today = toDateOnlyUTC(new Date());
const daysAgo = (n: number) => new Date(today.getTime() - n * DAY);
const key = (d: Date) => d.toISOString().slice(0, 10);

let empA: number; // Eng department, the fully-seeded employee
let empB: number; // Eng-Sub (child of Eng), Dev designation
let empC: number; // Ops department
let engDeptId: number;
let opsDeptId: number;
let devDesignationId: number;
let emptyDesignationId: number;

const section = (rating = "GOOD") => ({ rating, summary: "Steady.", highlights: ["ok"], concerns: [] });
const validImpression = () => ({
  attendance: section(),
  leave: section(),
  task: section("NEEDS_ATTENTION"),
  overall: section("GOOD"),
});

let mockGenerateJson: jest.Mock;

function as(req: request.Test, token: string) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
}
const asAdmin = (req: request.Test) => as(req, adminToken);
const generate = (body: unknown, token = adminToken) => as(request(app).post("/api/ai-kpi-reports"), token).send(body as object);
const employeeScope = (id: number) => ({ type: "EMPLOYEE", id });
const last2Weeks = { type: "LAST_2_WEEKS" };

async function createStaff(email: string, departmentId: number) {
  const res = await asAdmin(request(app).post("/api/employees")).send({
    firstName: "Staff",
    lastName: email.split("@")[0],
    email,
    joiningDate: "2026-01-01",
    departmentId,
    role: "Staff",
    password: "SuperSecret123!",
  });
  expect(res.status).toBe(201);
  return res.body.id as number;
}

beforeAll(async () => {
  tenant = await setupTestTenant("kpi");
  adminToken = await loginAsAdmin(app, tenant);
  tc = getTenantClient(tenant.databaseName);
  const adminUser = await tc.user.findFirstOrThrow({ where: { email: tenant.adminEmail }, include: { employee: true } });
  adminUserId = adminUser.id;
  const adminEmployeeId = adminUser.employee!.id;

  engDeptId = (await tc.department.create({ data: { name: "Eng" } })).id;
  const subDeptId = (await tc.department.create({ data: { name: "Eng-Sub", parentDepartmentId: engDeptId } })).id;
  opsDeptId = (await tc.department.create({ data: { name: "Ops" } })).id;
  devDesignationId = (await tc.designation.create({ data: { name: "Dev" } })).id;
  emptyDesignationId = (await tc.designation.create({ data: { name: "Nobody" } })).id;

  empA = await createStaff("kpi.a@example.com", engDeptId);
  empB = await createStaff("kpi.b@example.com", subDeptId);
  empC = await createStaff("kpi.c@example.com", opsDeptId);
  await tc.employee.update({ where: { id: empB }, data: { designationId: devDesignationId } });

  const staffLogin = await request(app)
    .post("/api/auth/login")
    .set(TENANT_HEADER, tenant.slug)
    .send({ email: "kpi.a@example.com", password: "SuperSecret123!" });
  staffToken = staffLogin.body.accessToken;

  // --- attendance for A: 3 counted days (2 present incl. 1 late, 1 absent) + a leave day + a weekend
  const shift = await tc.dutySchedule.create({ data: { name: "Day", startTime: "09:00", endTime: "17:00" } });
  const roster = await tc.roster.create({
    data: { departmentId: engDeptId, periodType: "Weekly", startDate: daysAgo(6), endDate: daysAgo(1), createdById: adminUserId },
  });
  const assign = (n: number, extra: Record<string, unknown>) =>
    tc.dutyScheduleAssignment.create({
      data: {
        rosterId: roster.id,
        employeeId: empA,
        dutyScheduleId: shift.id,
        departmentId: engDeptId,
        date: daysAgo(n),
        createdById: adminUserId,
        ...extra,
      },
    });
  const onTime = await assign(1, { status: "Completed" });
  await tc.attendance.create({
    data: {
      employeeId: empA,
      dutyScheduleAssignmentId: onTime.id,
      date: onTime.date,
      checkInAt: new Date(daysAgo(1).getTime() + 9 * HOUR),
      checkOutAt: new Date(daysAgo(1).getTime() + 17 * HOUR),
    },
  });
  const late = await assign(2, { status: "Completed" });
  await tc.attendance.create({
    data: {
      employeeId: empA,
      dutyScheduleAssignmentId: late.id,
      date: late.date,
      checkInAt: new Date(daysAgo(2).getTime() + 10 * HOUR),
      checkOutAt: new Date(daysAgo(2).getTime() + 17 * HOUR),
      isLate: true,
    },
  });
  await assign(3, { status: "Incomplete" }); // absent
  await assign(4, { status: "OnLeave", isLeave: true }); // excluded
  await assign(5, { status: "Scheduled", isWeekend: true }); // excluded

  // --- leave for A
  const leaveType = await tc.leaveType.create({ data: { name: "Annual", assignedDays: 10 } });
  const allocation = await tc.employeeLeaveAllocation.create({
    data: {
      employeeId: empA,
      leaveTypeId: leaveType.id,
      year: today.getUTCFullYear(),
      allocatedDays: 10,
      daysUsed: 2,
      createdById: adminUserId,
    },
  });
  const leave = (status: string, from: number, to: number, days: number) =>
    tc.leaveRequest.create({
      data: {
        employeeId: empA,
        allocationId: allocation.id,
        startDate: daysAgo(from),
        endDate: daysAgo(to),
        daysRequested: days,
        status,
        createdById: adminUserId,
      },
    });
  await leave("Approved", 8, 7, 2); // 2 days inside the period
  await leave("Approved", 15, 13, 3); // straddles the period start (last 2 weeks = today-13..today): 1 of 3 days inside
  await leave("Pending", 3, 3, 1);
  await leave("Rejected", 10, 10, 1);

  // --- tasks for A
  const project = (
    await asAdmin(request(app).post("/api/projects")).send({
      title: "KPI project",
      contractType: "fixed",
      totalAmount: 1000,
      estimatedHours: 10,
      deadlineType: "casual",
      startDate: "2026-01-01",
      supervisorId: adminEmployeeId,
      priority: "medium",
      memberIds: [empA],
    })
  ).body.id as number;
  const task = async (title: string, data: Record<string, unknown>) => {
    const t = await createTaskWithNumber(tc, {
      projectId: project,
      title,
      priority: "medium",
      timeType: "flexible",
      supervisorId: adminEmployeeId,
      description: "",
      createdById: adminUserId,
      ...data,
    } as never);
    await tc.taskMember.create({ data: { taskId: t.id, employeeId: empA } });
    return t;
  };
  await task("on-time", { status: "completed", dueDate: daysAgo(6), completedAt: daysAgo(7) });
  await task("late", { status: "completed", dueDate: daysAgo(6), completedAt: daysAgo(3) });
  await task("overdue", { status: "in_progress", dueDate: daysAgo(4), progressPercentage: 30 });
  await task("not-yet-due", { status: "to_do", dueDate: today }); // due end of today => not overdue yet
  await task("cancelled", { status: "cancelled", dueDate: daysAgo(5) }); // ignored
  await task("outside-period", { status: "to_do", dueDate: daysAgo(40) }); // ignored

  const anyTask = await tc.task.findFirstOrThrow({ where: { title: "on-time" } });
  await tc.timeEntry.create({
    data: { taskId: anyTask.id, employeeId: empA, startTime: new Date(daysAgo(6).getTime() + 9 * HOUR), endTime: new Date(daysAgo(6).getTime() + 11 * HOUR) },
  });
}, 120000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

beforeEach(() => {
  mockGenerateJson = jest.fn().mockResolvedValue(validImpression());
  mockGetLlmProvider.mockReset();
  mockGetLlmProvider.mockResolvedValue({ generateJson: (...args: unknown[]) => mockGenerateJson(...args) });
});

describe("access control", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/ai-kpi-reports").set(TENANT_HEADER, tenant.slug).send({});
    expect(res.status).toBe(401);
  });

  it("rejects Staff", async () => {
    expect((await generate({ scope: employeeScope(empA), period: last2Weeks }, staffToken)).status).toBe(403);
    expect((await as(request(app).get("/api/ai-kpi-reports"), staffToken)).status).toBe(403);
  });
});

describe("input validation", () => {
  const custom = (startDate?: string, endDate?: string) => ({
    scope: employeeScope(empA),
    period: { type: "CUSTOM", startDate, endDate },
  });

  it("requires both dates for a custom period", async () => {
    expect((await generate(custom("2026-01-01"))).status).toBe(400);
  });

  it("rejects an inverted range", async () => {
    expect((await generate(custom(key(daysAgo(1)), key(daysAgo(5))))).status).toBe(400);
  });

  it("rejects an end date in the future", async () => {
    const res = await generate(custom(key(daysAgo(2)), key(new Date(today.getTime() + 2 * DAY))));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PERIOD");
  });

  it("rejects a range longer than 366 days", async () => {
    const res = await generate(custom(key(daysAgo(400)), key(daysAgo(1))));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PERIOD");
  });

  it("404s for an unknown employee and rejects an empty scope", async () => {
    expect((await generate({ scope: employeeScope(999999), period: last2Weeks })).status).toBe(404);
    const empty = await generate({ scope: { type: "DESIGNATION", id: emptyDesignationId }, period: last2Weeks });
    expect(empty.status).toBe(400);
    expect(empty.body.error.code).toBe("EMPTY_SCOPE");
  });
});

describe("POST /api/ai-kpi-reports (single employee)", () => {
  let report: AiKpiReportDto;

  beforeAll(async () => {
    mockGetLlmProvider.mockResolvedValue({ generateJson: async () => validImpression() });
    const res = await generate({ scope: employeeScope(empA), period: last2Weeks });
    expect(res.status).toBe(201);
    report = res.body;
  });

  it("resolves the 2-week preset to 14 days ending today", () => {
    expect(report.periodType).toBe("LAST_2_WEEKS");
    expect(report.startDate).toBe(key(daysAgo(13)));
    expect(report.endDate).toBe(key(today));
    expect(report.employeeCount).toBe(1);
    expect(report.scopeLabel).toBe("Staff kpi.a");
  });

  it("computes attendance metrics, excluding leave and weekend days", () => {
    expect(report.metrics.attendance.totals).toMatchObject({
      scheduledDays: 3,
      presentDays: 2,
      absentDays: 1,
      lateCount: 1,
      attendanceRate: 66.7,
      workedMinutes: 8 * 60 + 7 * 60,
    });
  });

  it("computes leave metrics with the straddling request prorated to the period", () => {
    expect(report.metrics.leave.totals).toMatchObject({
      requestCount: 4,
      approvedRequests: 2,
      pendingRequests: 1,
      rejectedRequests: 1,
      approvedDays: 3, // 2 + 1 of 3 days inside the period
      pendingDays: 1,
      remainingBalanceDays: 8,
      daysByLeaveType: [{ leaveTypeName: "Annual", days: 3 }],
    });
  });

  it("computes task deadline metrics", () => {
    expect(report.metrics.task.totals).toMatchObject({
      dueInPeriod: 4,
      completedOnTime: 1,
      completedLate: 1,
      overdueOpen: 1,
      openNotYetDue: 1,
      onTimeRate: 33.3,
      averageOpenProgress: 15, // (30 + 0) / 2
      hoursLogged: 2,
    });
  });

  it("returns the LLM impression and stamps provider/model", () => {
    expect(report.impression.task.rating).toBe("NEEDS_ATTENTION");
    expect(report.impression.overall.rating).toBe("GOOD");
    expect(report.provider).toBe("groq");
    expect(report.model).toBe("test-model");
    expect(report.generatedByEmail).toBe(tenant.adminEmail);
  });

  it("sends the LLM only aggregated metrics", async () => {
    await generate({ scope: employeeScope(empA), period: last2Weeks });
    const request = mockGenerateJson.mock.calls[0][0] as { system: string; prompt: string };
    expect(request.prompt).toContain("attendanceRate");
    expect(request.prompt).toContain("Staff kpi.a");
    expect(request.prompt).not.toContain("kpi.a@example.com");
    expect(request.system).toContain("ONLY JSON");
  });

  it("supports the 4-week preset and a custom range", async () => {
    const four = await generate({ scope: employeeScope(empA), period: { type: "LAST_4_WEEKS" } });
    expect(four.body.startDate).toBe(key(daysAgo(27)));

    const range = await generate({
      scope: employeeScope(empA),
      period: { type: "CUSTOM", startDate: key(daysAgo(6)), endDate: key(daysAgo(6)) },
    });
    expect(range.status).toBe(201);
    expect(range.body.periodType).toBe("CUSTOM");
    expect(range.body.metrics.task.totals.dueInPeriod).toBe(2); // the two tasks due that day
  });
});

describe("scope resolution", () => {
  it("includes child departments for a department scope and excludes other departments", async () => {
    const res = await generate({ scope: { type: "DEPARTMENT", id: engDeptId }, period: last2Weeks });
    expect(res.status).toBe(201);
    expect(res.body.employeeCount).toBe(2);
    const names = res.body.metrics.attendance.employees.map((e: { employeeId: number }) => e.employeeId).sort();
    expect(names).toEqual([empA, empB].sort());
    expect(res.body.metrics.attendance.totals.scheduledDays).toBe(3); // only A has roster data
  });

  it("resolves a designation scope", async () => {
    const res = await generate({ scope: { type: "DESIGNATION", id: devDesignationId }, period: last2Weeks });
    expect(res.status).toBe(201);
    expect(res.body.employeeCount).toBe(1);
    expect(res.body.metrics.attendance.employees[0].employeeId).toBe(empB);
  });

  it("does not leak other departments' employees", async () => {
    const res = await generate({ scope: { type: "DEPARTMENT", id: opsDeptId }, period: last2Weeks });
    expect(res.body.employeeCount).toBe(1);
    expect(res.body.metrics.attendance.employees[0].employeeId).toBe(empC);
  });
});

describe("LLM failures", () => {
  it("returns 502 and saves nothing when the LLM is not configured", async () => {
    const before = await tc.aiKpiReport.count();
    mockGetLlmProvider.mockRejectedValue(new ApiError(502, "GROQ_API_KEY is not configured", "LLM_NOT_CONFIGURED"));
    const res = await generate({ scope: employeeScope(empA), period: last2Weeks });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("LLM_NOT_CONFIGURED");
    expect(await tc.aiKpiReport.count()).toBe(before);
  });

  it("returns 502 and saves nothing when the provider call fails", async () => {
    const before = await tc.aiKpiReport.count();
    mockGenerateJson.mockRejectedValue(new ApiError(502, "AI provider request failed", "LLM_ERROR"));
    const res = await generate({ scope: employeeScope(empA), period: last2Weeks });
    expect(res.status).toBe(502);
    expect(await tc.aiKpiReport.count()).toBe(before);
  });

  it("rejects malformed LLM output and saves nothing", async () => {
    const before = await tc.aiKpiReport.count();
    mockGenerateJson.mockResolvedValue({ attendance: section(), overall: { rating: "AMAZING", summary: "x" } });
    const res = await generate({ scope: employeeScope(empA), period: last2Weeks });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("LLM_INVALID_OUTPUT");
    expect(await tc.aiKpiReport.count()).toBe(before);
  });

  it("normalises a loosely-cased rating from the LLM", async () => {
    mockGenerateJson.mockResolvedValue({ ...validImpression(), overall: { ...section(), rating: "needs attention" } });
    const res = await generate({ scope: employeeScope(empA), period: last2Weeks });
    expect(res.status).toBe(201);
    expect(res.body.impression.overall.rating).toBe("NEEDS_ATTENTION");
  });
});

describe("history", () => {
  it("lists, fetches and deletes saved reports without another LLM call", async () => {
    const created = await generate({ scope: employeeScope(empA), period: last2Weeks });
    const id = created.body.id as number;
    mockGenerateJson.mockClear();

    const list = await asAdmin(request(app).get("/api/ai-kpi-reports?page=1&pageSize=50"));
    expect(list.status).toBe(200);
    const item = list.body.items.find((i: { id: number }) => i.id === id);
    expect(item).toMatchObject({ scopeType: "EMPLOYEE", overallRating: "GOOD", employeeCount: 1 });
    expect(list.body.items[0].createdAt >= list.body.items[list.body.items.length - 1].createdAt).toBe(true);

    const one = await asAdmin(request(app).get(`/api/ai-kpi-reports/${id}`));
    expect(one.status).toBe(200);
    expect(one.body.metrics.attendance.totals.presentDays).toBe(2);
    expect(mockGenerateJson).not.toHaveBeenCalled();

    expect((await asAdmin(request(app).delete(`/api/ai-kpi-reports/${id}`))).status).toBe(204);
    expect((await asAdmin(request(app).get(`/api/ai-kpi-reports/${id}`))).status).toBe(404);
  });
});

describe("Task.completedAt", () => {
  it("is stamped when a task is completed and cleared when it is reopened", async () => {
    const project = (await tc.project.findFirstOrThrow({ where: { title: "KPI project" } })).id;
    const created = await asAdmin(request(app).post("/api/tasks")).send({
      projectId: project,
      title: "Track completion",
      priority: "medium",
      timeType: "flexible",
      status: "in_progress",
    });
    expect(created.status).toBe(201);
    const id = created.body.id as number;
    expect((await tc.task.findUniqueOrThrow({ where: { id } })).completedAt).toBeNull();

    await asAdmin(request(app).patch(`/api/tasks/${id}`)).send({ status: "completed" });
    const completedAt = (await tc.task.findUniqueOrThrow({ where: { id } })).completedAt;
    expect(completedAt).not.toBeNull();

    // re-saving as completed keeps the original timestamp
    await asAdmin(request(app).patch(`/api/tasks/${id}`)).send({ status: "completed" });
    expect((await tc.task.findUniqueOrThrow({ where: { id } })).completedAt?.getTime()).toBe(completedAt!.getTime());

    await asAdmin(request(app).patch(`/api/tasks/${id}`)).send({ status: "in_progress" });
    expect((await tc.task.findUniqueOrThrow({ where: { id } })).completedAt).toBeNull();
  });
});
