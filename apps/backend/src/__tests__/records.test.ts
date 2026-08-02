import request from "supertest";
import { TENANT_HEADER } from "@hrm-plus/shared";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import { disconnectAllTenantClients } from "../db/tenantClientPool";
import { loginAsAdmin, setupTestTenant, teardownTestTenant, TestTenant } from "./testUtils";

const app = createApp();
let tenant: TestTenant;
let adminToken: string;

const todayStr = new Date().toISOString().slice(0, 10);

beforeAll(async () => {
  tenant = await setupTestTenant("records");
  adminToken = await loginAsAdmin(app, tenant);
}, 30000);

afterAll(async () => {
  await teardownTestTenant(tenant);
  await disconnectAllTenantClients();
  await controlClient.$disconnect();
});

function asAdmin(req: request.Test) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${adminToken}`);
}

function asUser(req: request.Test, token: string) {
  return req.set(TENANT_HEADER, tenant.slug).set("Authorization", `Bearer ${token}`);
}

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

  const loginRes = await request(app)
    .post("/api/auth/login")
    .set(TENANT_HEADER, tenant.slug)
    .send({ email, password: "SuperSecret123!" });
  expect(loginRes.status).toBe(200);

  return { employeeId: res.body.id as number, token: loginRes.body.accessToken as string };
}

describe("Attendance report: dutyScheduleId filter", () => {
  it("only returns rows matching the given duty schedule", async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Report Dept" });
    const staff = await createStaff("records.attendance@example.com", department.body.id);

    const scheduleA = await asAdmin(request(app).post("/api/duty-schedules")).send({
      name: "Schedule A",
      startTime: "09:00",
      endTime: "17:00",
    });
    const scheduleB = await asAdmin(request(app).post("/api/duty-schedules")).send({
      name: "Schedule B",
      startTime: "10:00",
      endTime: "18:00",
    });

    const roster = await asAdmin(request(app).post("/api/rosters")).send({
      departmentId: department.body.id,
      periodType: "Weekly",
      startDate: todayStr,
      endDate: todayStr,
    });
    await asAdmin(request(app).post(`/api/rosters/${roster.body.id}/assignments`)).send({
      employeeId: staff.employeeId,
      dutyScheduleId: scheduleA.body.id,
      date: todayStr,
    });

    const matching = await asAdmin(
      request(app).get("/api/attendance").query({ dutyScheduleId: scheduleA.body.id, startDate: todayStr, endDate: todayStr })
    );
    expect(matching.status).toBe(200);
    expect(matching.body).toHaveLength(1);

    const nonMatching = await asAdmin(
      request(app).get("/api/attendance").query({ dutyScheduleId: scheduleB.body.id, startDate: todayStr, endDate: todayStr })
    );
    expect(nonMatching.status).toBe(200);
    expect(nonMatching.body).toHaveLength(0);
  });
});

describe("Worksheet aggregation", () => {
  it("computes working minutes as total minutes minus break minutes", async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Worksheet Dept" });
    const staff = await createStaff("records.worksheet@example.com", department.body.id);

    const dutySchedule = await asAdmin(request(app).post("/api/duty-schedules")).send({
      name: "Round the clock",
      startTime: "00:00",
      endTime: "23:59",
      checkinConsiderMinutes: 1440,
      checkoutConsiderMinutes: 1440,
      earlyCheckinBufferMinutes: 1440,
    });

    const roster = await asAdmin(request(app).post("/api/rosters")).send({
      departmentId: department.body.id,
      periodType: "Weekly",
      startDate: todayStr,
      endDate: todayStr,
    });
    await asAdmin(request(app).post(`/api/rosters/${roster.body.id}/assignments`)).send({
      employeeId: staff.employeeId,
      dutyScheduleId: dutySchedule.body.id,
      date: todayStr,
    });
    await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/methods`)).send({
      methods: ["PressAndHold"],
    });

    const checkIn = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
    });
    expect(checkIn.status).toBe(200);

    const startBreak = await asUser(request(app).post("/api/attendance/breaks/start"), staff.token);
    expect(startBreak.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const endBreak = await asUser(request(app).post("/api/attendance/breaks/end"), staff.token);
    expect(endBreak.status).toBe(200);

    const checkOut = await asUser(request(app).post("/api/attendance/check-out"), staff.token).send({
      method: "PressAndHold",
    });
    expect(checkOut.status).toBe(200);

    const worksheet = await asAdmin(
      request(app)
        .get("/api/attendance/worksheet")
        .query({ startDate: todayStr, endDate: todayStr, employeeId: staff.employeeId })
    );
    expect(worksheet.status).toBe(200);
    expect(worksheet.body).toHaveLength(1);
    const row = worksheet.body[0];
    expect(row.daysPresent).toBe(1);
    expect(row.workingMinutes).toBe(row.totalMinutes - row.totalBreakMinutes);
    expect(row.totalMinutes).toBeGreaterThanOrEqual(0);
  });
});

describe("Leave report filters", () => {
  it("filters by department, leave type, and date range overlap", async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Leave Report Dept" });
    const otherDepartment = await asAdmin(request(app).post("/api/departments")).send({ name: "Other Dept" });
    const staff = await createStaff("records.leave@example.com", department.body.id);

    const leaveType = await asAdmin(request(app).post("/api/leave-types")).send({
      name: "Report Leave",
      assignedDays: 10,
    });
    const otherLeaveType = await asAdmin(request(app).post("/api/leave-types")).send({
      name: "Other Leave",
      assignedDays: 10,
    });

    const rolesRes = await asAdmin(request(app).get("/api/roles"));
    const adminRoleId = rolesRes.body.find((r: any) => r.name === "Admin").id;

    await asAdmin(request(app).post("/api/weekdays")).send({ name: "Sunday", isWeekend: false });

    await asAdmin(request(app).post(`/api/employees/${staff.employeeId}/leave-allocations`)).send({
      leaveTypeId: leaveType.body.id,
      year: Number(todayStr.slice(0, 4)),
      allocatedDays: 10,
      approvalSteps: [{ approverType: "Role", roleId: adminRoleId }],
    });

    const leaveRequest = await asUser(request(app).post("/api/leave-requests"), staff.token).send({
      leaveTypeId: leaveType.body.id,
      startDate: todayStr,
      endDate: todayStr,
    });
    expect(leaveRequest.status).toBe(201);

    // Matches: right department, right leave type, date range includes today
    const matching = await asAdmin(
      request(app)
        .get("/api/leave-requests")
        .query({ departmentId: department.body.id, leaveTypeId: leaveType.body.id, startDate: todayStr, endDate: todayStr })
    );
    expect(matching.status).toBe(200);
    expect(matching.body.items.some((r: any) => r.id === leaveRequest.body.id)).toBe(true);

    // No match: wrong department
    const wrongDept = await asAdmin(
      request(app).get("/api/leave-requests").query({ departmentId: otherDepartment.body.id })
    );
    expect(wrongDept.body.items.some((r: any) => r.id === leaveRequest.body.id)).toBe(false);

    // No match: wrong leave type
    const wrongType = await asAdmin(
      request(app).get("/api/leave-requests").query({ leaveTypeId: otherLeaveType.body.id })
    );
    expect(wrongType.body.items.some((r: any) => r.id === leaveRequest.body.id)).toBe(false);

    // No match: date range entirely before the request
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const wrongRange = await asAdmin(
      request(app).get("/api/leave-requests").query({ startDate: past, endDate: past })
    );
    expect(wrongRange.body.items.some((r: any) => r.id === leaveRequest.body.id)).toBe(false);
  });
});
