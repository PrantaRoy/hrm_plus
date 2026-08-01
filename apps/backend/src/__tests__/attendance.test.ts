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
  tenant = await setupTestTenant("attendance");
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

describe("Attendance check-in / check-out", () => {
  let departmentId: number;
  let dutyScheduleId: number;
  let rosterId: number;
  let staffToken: string;
  let staffEmployeeId: number;

  beforeAll(async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Ops" });
    departmentId = department.body.id;

    const staff = await createStaff("attendance.staff@example.com", departmentId);
    staffEmployeeId = staff.employeeId;
    staffToken = staff.token;

    // Same-UTC-day start/end with zero grace so "now" always lands as late-checkin
    // and early-checkout, regardless of when in the day the test suite runs.
    const dutySchedule = await asAdmin(request(app).post("/api/duty-schedules")).send({
      name: "Round the clock",
      startTime: "00:00",
      endTime: "23:59",
      checkinConsiderMinutes: 0,
      checkoutConsiderMinutes: 0,
      earlyCheckinBufferMinutes: 0,
    });
    dutyScheduleId = dutySchedule.body.id;

    const roster = await asAdmin(request(app).post("/api/rosters")).send({
      departmentId,
      periodType: "Weekly",
      startDate: todayStr,
      endDate: todayStr,
    });
    rosterId = roster.body.id;
  }, 30000);

  it("blocks check-in when there is no duty schedule assignment for today", async () => {
    const res = await asUser(request(app).post("/api/attendance/check-in"), staffToken).send({
      method: "PressAndHold",
    });
    expect(res.status).toBe(400);
  });

  it("blocks check-in when the method isn't assigned to the employee", async () => {
    await asAdmin(request(app).post(`/api/rosters/${rosterId}/assignments`)).send({
      employeeId: staffEmployeeId,
      dutyScheduleId,
      date: todayStr,
    });

    const res = await asUser(request(app).post("/api/attendance/check-in"), staffToken).send({
      method: "PressAndHold",
    });
    expect(res.status).toBe(403);
  });

  it("requires a reason for a late check-in, then succeeds once one is given", async () => {
    await asAdmin(request(app).put(`/api/attendance/employees/${staffEmployeeId}/methods`)).send({
      methods: ["PressAndHold"],
    });

    const withoutReason = await asUser(request(app).post("/api/attendance/check-in"), staffToken).send({
      method: "PressAndHold",
    });
    expect(withoutReason.status).toBe(400);

    const withReason = await asUser(request(app).post("/api/attendance/check-in"), staffToken).send({
      method: "PressAndHold",
      reason: "Traffic delay",
    });
    expect(withReason.status).toBe(200);
    expect(withReason.body.attendance.isLate).toBe(true);
    expect(withReason.body.attendance.lateReason).toBe("Traffic delay");
    expect(withReason.body.assignment.status).toBe("CheckedIn");
  });

  it("rejects a second check-in on the same day", async () => {
    const res = await asUser(request(app).post("/api/attendance/check-in"), staffToken).send({
      method: "PressAndHold",
    });
    expect(res.status).toBe(409);
  });

  it("blocks checkout while a break is open, then requires a reason for early checkout", async () => {
    const start = await asUser(request(app).post("/api/attendance/breaks/start"), staffToken);
    expect(start.status).toBe(200);
    expect(start.body.isOnBreak).toBe(true);

    const blockedCheckout = await asUser(request(app).post("/api/attendance/check-out"), staffToken).send({
      method: "PressAndHold",
    });
    expect(blockedCheckout.status).toBe(409);

    const end = await asUser(request(app).post("/api/attendance/breaks/end"), staffToken);
    expect(end.status).toBe(200);
    expect(end.body.isOnBreak).toBe(false);

    const withoutReason = await asUser(request(app).post("/api/attendance/check-out"), staffToken).send({
      method: "PressAndHold",
    });
    expect(withoutReason.status).toBe(400);

    const withReason = await asUser(request(app).post("/api/attendance/check-out"), staffToken).send({
      method: "PressAndHold",
      reason: "Left early for an appointment",
    });
    expect(withReason.status).toBe(200);
    expect(withReason.body.attendance.isEarlyCheckout).toBe(true);
    expect(withReason.body.assignment.status).toBe("Completed");
    expect(withReason.body.attendance.breaks).toHaveLength(1);
    expect(withReason.body.attendance.breaks[0].endAt).not.toBeNull();
  });
});

describe("Leave approval sets the assignment to On Leave", () => {
  it("flips today's assignment to OnLeave once the leave request is approved", async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Leave Dept" });
    const departmentId = department.body.id;

    const staff = await createStaff("attendance.leave@example.com", departmentId);

    const roster = await asAdmin(request(app).post("/api/rosters")).send({
      departmentId,
      periodType: "Weekly",
      startDate: todayStr,
      endDate: todayStr,
    });
    await asAdmin(request(app).post(`/api/rosters/${roster.body.id}/assignments`)).send({
      employeeId: staff.employeeId,
      date: todayStr,
    });

    // Neutralize weekend detection so `today` always counts as a leave-eligible day.
    await asAdmin(request(app).post("/api/weekdays")).send({ name: "Sunday", isWeekend: false });

    const leaveType = await asAdmin(request(app).post("/api/leave-types")).send({
      name: "Casual Leave",
      assignedDays: 10,
    });

    const rolesRes = await asAdmin(request(app).get("/api/roles"));
    const adminRoleId = rolesRes.body.find((r: any) => r.name === "Admin").id;

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

    const approved = await asAdmin(request(app).post(`/api/leave-requests/${leaveRequest.body.id}/approve`));
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe("Approved");

    const attendanceList = await asAdmin(
      request(app).get("/api/attendance").query({ employeeId: staff.employeeId, startDate: todayStr, endDate: todayStr })
    );
    expect(attendanceList.status).toBe(200);
    expect(attendanceList.body).toHaveLength(1);
    expect(attendanceList.body[0].status).toBe("OnLeave");
  });
});
