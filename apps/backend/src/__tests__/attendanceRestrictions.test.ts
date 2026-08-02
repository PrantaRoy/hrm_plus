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

function hhmmFromNow(offsetMinutes: number): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

beforeAll(async () => {
  tenant = await setupTestTenant("attrestrict");
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

async function setupEmployeeWithAssignment(email: string, dutyScheduleOverrides: Record<string, unknown> = {}) {
  const department = await asAdmin(request(app).post("/api/departments")).send({ name: `Dept-${email}` });
  const departmentId = department.body.id;
  const staff = await createStaff(email, departmentId);

  const dutySchedule = await asAdmin(request(app).post("/api/duty-schedules")).send({
    name: "Round the clock",
    startTime: "00:00",
    endTime: "23:59",
    checkinConsiderMinutes: 0,
    checkoutConsiderMinutes: 0,
    earlyCheckinBufferMinutes: 0,
    ...dutyScheduleOverrides,
  });

  const roster = await asAdmin(request(app).post("/api/rosters")).send({
    departmentId,
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

  return staff;
}

describe("IP binding", () => {
  it("rejects check-in from a non-approved network and allows it once the network matches", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.ip.staff@example.com");

    const rejectRule = await asAdmin(request(app).post("/api/attendance-ip-rules")).send({
      label: "Unrelated network",
      cidr: "203.0.113.0/24",
    });
    await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/rules`)).send({
      ipBindingEnabled: true,
      locationBindingEnabled: false,
      deviceBindingEnabled: false,
      ipRuleIds: [rejectRule.body.id],
      locationIds: [],
    });

    const blocked = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
      reason: "late ok",
    });
    expect(blocked.status).toBe(403);

    const allowAllRule = await asAdmin(request(app).post("/api/attendance-ip-rules")).send({
      label: "Any IPv4",
      cidr: "0.0.0.0/0",
    });
    const allowAllV6Rule = await asAdmin(request(app).post("/api/attendance-ip-rules")).send({
      label: "Any IPv6",
      cidr: "::/0",
    });
    await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/rules`)).send({
      ipBindingEnabled: true,
      locationBindingEnabled: false,
      deviceBindingEnabled: false,
      ipRuleIds: [allowAllRule.body.id, allowAllV6Rule.body.id],
      locationIds: [],
    });

    const allowed = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
      reason: "late ok",
    });
    expect(allowed.status).toBe(200);
    expect(allowed.body.assignment.status).toBe("CheckedIn");
  });
});

describe("Location binding", () => {
  it("rejects check-in outside the radius and allows it inside", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.loc.staff@example.com");

    const location = await asAdmin(request(app).post("/api/attendance-locations")).send({
      name: "Head Office",
      latitude: 23.8103,
      longitude: 90.4125,
      radiusMeters: 100,
    });

    await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/rules`)).send({
      ipBindingEnabled: false,
      locationBindingEnabled: true,
      deviceBindingEnabled: false,
      ipRuleIds: [],
      locationIds: [location.body.id],
    });

    const missingLocation = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
      reason: "late ok",
    });
    expect(missingLocation.status).toBe(400);

    const farAway = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
      reason: "late ok",
      latitude: 23.9103,
      longitude: 90.5125,
    });
    expect(farAway.status).toBe(403);

    const onSite = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
      reason: "late ok",
      latitude: 23.8103,
      longitude: 90.4125,
    });
    expect(onSite.status).toBe(200);
    expect(onSite.body.assignment.status).toBe("CheckedIn");
  });
});

describe("Device binding", () => {
  it("blocks an unapproved device, then allows it once HR approves it", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.device.staff@example.com");

    await asAdmin(request(app).put(`/api/attendance/employees/${staff.employeeId}/rules`)).send({
      ipBindingEnabled: false,
      locationBindingEnabled: false,
      deviceBindingEnabled: true,
      ipRuleIds: [],
      locationIds: [],
    });

    const deviceToken = "test-device-token-AAAA";
    const blocked = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
      reason: "late ok",
      deviceToken,
    });
    expect(blocked.status).toBe(403);

    const devices = await asAdmin(request(app).get(`/api/attendance/employees/${staff.employeeId}/devices`));
    expect(devices.status).toBe(200);
    expect(devices.body).toHaveLength(1);
    expect(devices.body[0].status).toBe("Pending");

    const approve = await asAdmin(
      request(app).post(`/api/attendance/employees/${staff.employeeId}/devices/${devices.body[0].id}/approve`)
    );
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe("Approved");

    const allowed = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
      reason: "late ok",
      deviceToken,
    });
    expect(allowed.status).toBe(200);
  });
});

describe("Resume after an accidental checkout", () => {
  it("lets the employee check in again before the shift ends, logging the gap as an automatic break", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.resume.staff@example.com");

    const checkIn = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
      reason: "late ok",
    });
    expect(checkIn.status).toBe(200);

    const checkOut = await asUser(request(app).post("/api/attendance/check-out"), staff.token).send({
      method: "PressAndHold",
      reason: "left early by mistake",
    });
    expect(checkOut.status).toBe(200);
    expect(checkOut.body.assignment.status).toBe("Completed");

    const resume = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
    });
    expect(resume.status).toBe(200);
    expect(resume.body.assignment.status).toBe("CheckedIn");
    expect(resume.body.attendance.checkOutAt).toBeNull();
    expect(resume.body.attendance.breaks.some((b: any) => b.endAt !== null)).toBe(true);
  });

  it("refuses to resume once the shift has ended", async () => {
    const staff = await setupEmployeeWithAssignment("attendance.resume.late.staff@example.com", {
      startTime: "00:00",
      endTime: hhmmFromNow(-2),
    });

    const checkIn = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
      reason: "late ok",
    });
    expect(checkIn.status).toBe(200);

    const checkOut = await asUser(request(app).post("/api/attendance/check-out"), staff.token).send({
      method: "PressAndHold",
    });
    expect(checkOut.status).toBe(200);

    const resume = await asUser(request(app).post("/api/attendance/check-in"), staff.token).send({
      method: "PressAndHold",
    });
    expect(resume.status).toBe(400);
  });
});
