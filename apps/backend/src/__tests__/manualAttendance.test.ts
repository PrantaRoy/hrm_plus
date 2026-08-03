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
  tenant = await setupTestTenant("manualatt");
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

describe("Manual attendance entry", () => {
  it("is rejected by non-admin/HR roles", async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Manual Dept Auth" });
    const staff = await createStaff("manual.auth@example.com", department.body.id);

    const res = await asUser(request(app).put(`/api/attendance/employees/${staff.employeeId}/manual-entry`), staff.token).send({
      date: todayStr,
      checkInTime: "09:00",
      checkOutTime: "17:00",
    });
    expect(res.status).toBe(403);
  });

  it("rejects when no duty schedule assignment exists for that employee/date", async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Manual Dept NoAssign" });
    const staff = await createStaff("manual.noassign@example.com", department.body.id);

    const res = await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/manual-entry`)).send({
      date: todayStr,
      checkInTime: "09:00",
      checkOutTime: "17:00",
    });
    expect(res.status).toBe(400);
  });

  it("records manual check-in/out, flags late/early, and marks the assignment Completed", async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Manual Dept" });
    const staff = await createStaff("manual.staff@example.com", department.body.id);

    const dutySchedule = await asAdmin(request(app).post("/api/duty-schedules")).send({
      name: "9 to 5",
      startTime: "09:00",
      endTime: "17:00",
      checkinConsiderMinutes: 10,
      checkoutConsiderMinutes: 10,
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

    // Late check-in (09:25, 15 min past the 10-min grace) and early checkout (16:00, before 16:50 threshold)
    const res = await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/manual-entry`)).send({
      date: todayStr,
      checkInTime: "09:25",
      checkOutTime: "16:00",
      note: "Forgot to punch, confirmed via CCTV",
    });
    expect(res.status).toBe(200);
    expect(res.body.isManualEntry).toBe(true);
    expect(res.body.isLate).toBe(true);
    expect(res.body.isEarlyCheckout).toBe(true);
    expect(res.body.manualEntryNote).toBe("Forgot to punch, confirmed via CCTV");

    const report = await asAdmin(
      request(app).get("/api/attendance").query({ employeeId: staff.employeeId, startDate: todayStr, endDate: todayStr })
    );
    expect(report.status).toBe(200);
    expect(report.body).toHaveLength(1);
    expect(report.body[0].status).toBe("Completed");
    expect(report.body[0].isManualEntry).toBe(true);

    // Editing the same day updates the existing record rather than creating a duplicate
    const edit = await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/manual-entry`)).send({
      date: todayStr,
      checkInTime: "09:00",
      checkOutTime: "17:00",
    });
    expect(edit.status).toBe(200);
    expect(edit.body.isLate).toBe(false);
    expect(edit.body.isEarlyCheckout).toBe(false);

    const reportAfterEdit = await asAdmin(
      request(app).get("/api/attendance").query({ employeeId: staff.employeeId, startDate: todayStr, endDate: todayStr })
    );
    expect(reportAfterEdit.body).toHaveLength(1);
  });

  it("rejects a check-out time before the check-in time", async () => {
    const department = await asAdmin(request(app).post("/api/departments")).send({ name: "Manual Dept Bad Range" });
    const staff = await createStaff("manual.badrange@example.com", department.body.id);

    const dutySchedule = await asAdmin(request(app).post("/api/duty-schedules")).send({
      name: "9 to 5 v2",
      startTime: "09:00",
      endTime: "17:00",
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

    const res = await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/manual-entry`)).send({
      date: todayStr,
      checkInTime: "17:00",
      checkOutTime: "09:00",
    });
    expect(res.status).toBe(400);
  });
});
